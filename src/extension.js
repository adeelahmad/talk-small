import * as vscode from 'vscode'
import path from 'path'
import fs from 'fs'
import { EventEmitter } from 'events'
import { generateRoomWithoutSeparator } from '@jitsi/js-utils/random/roomNameGenerator'
import {
	VIEW_ID,
	FOCUS_COMMAND,
	INITIALIZED_EVENT,
	CONNECTED_EVENT,
	DISCONNECTED_EVENT,
	LAST_USED_ROOM_NAME,
	CONFIG_SECTION,
	DISPLAY_NAME,
	CONNECT_REQUEST,
	DISCONNECT_REQUEST,
	CONNECT_COMMAND,
	DISCONNECT_COMMAND,
	SET_CONTEXT_COMMAND,
	CONNECTED_CONTEXT,
	CONNECTION_FAILED_EVENT,
	NOTIFICATION_EVENT,
	PASSWORD_REQUIRED_EVENT,
	PASSWORD_REQUEST
} from './constants'

/**
 * Generate content for webview from index.html while converting local file uris to webview ones
 * @param {vscode.ExtensionContext} context
 * @param {vscode.Webview} webview 
 * @returns {string}
 */
const getWebviewContent = (context, webview) => {
	const htmlPath = path.join(context.extensionPath, 'out/public/index.html')
	const cssUri = vscode.Uri.file(path.join(context.extensionPath, 'out/public/main.css'))
	const jsUri = vscode.Uri.file(path.join(context.extensionPath, 'out/public/main.js'))
	return fs.readFileSync(htmlPath, 'utf8')
		.replace('./main.css', webview.asWebviewUri(cssUri))
		.replace('./main.js', webview.asWebviewUri(jsUri))
}

class Extension extends EventEmitter {
	constructor() {
		super()

		/**
		 * @type {?vscode.ExtensionContext}
		 */
		this.context = null

		/**
		 * @type {?vscode.WebviewView}
		 */
		this.view = null

		/**
		 * @type {vscode.WorkspaceConfiguration}
		 */
		this.configuration = vscode.workspace.getConfiguration(CONFIG_SECTION)
	}

	/**
	 * Focus talk-small view
	 */
	async focus() {
		// trigger webview instantiation (prerequisite for connection)
		await vscode.commands.executeCommand(FOCUS_COMMAND)
	}

	/**
	 * Connect to jitsi conference
	 */
	async connect() {
		// instantiate webview if not done already
		if (!this.view) {
			// create promise from event
			const instantiation = new Promise(res => this.once(INITIALIZED_EVENT, res))

			// trigger webview instaniation
			await this.focus()

			// wait for webview `onload`
			await instantiation

			// try connecting again
			return this.connect()
		}

		// collect parameters
		const displayName = this.configuration.get(DISPLAY_NAME)
		const lastUsedRoomName = this.context.workspaceState.get(LAST_USED_ROOM_NAME)
		let roomName = await vscode.window.showInputBox({
			ignoreFocusOut: true,
			prompt: 'Enter a room name.',
			placeHolder: 'Leave empty for a random room.',
			value: lastUsedRoomName
		})

		// user skipped entering roomName, abort command
		if (roomName === undefined) return

		// user left the room name empty, generate one
		if (roomName === '') roomName = generateRoomWithoutSeparator()

		// connect through webview while showing progress
		return vscode.window.withProgress({
			location: { viewId: VIEW_ID },
			title: 'Connecting'
		}, async () => {
			// create promise from event
			const connection = new Promise((res, rej) => {
				const connected = () => {
					this.off(CONNECTION_FAILED_EVENT, connectionFailed)
					res()
				}
				const connectionFailed = () => {
					this.off(CONNECTED_EVENT, connected)
					rej()
				}
				this.once(CONNECTED_EVENT, connected)
				this.once(CONNECTION_FAILED_EVENT, connectionFailed)
			})

			// send connection request to webview
			await this.view.webview.postMessage({
				type: CONNECT_REQUEST,
				payload: {
					domain: 'meet.jit.si',
					options: {
						roomName,
						userInfo: { displayName },
						configOverwrite: {
							startAudioOnly: true, // we do not want video
							startWithAudioMuted: true, // it is "Push" to talk
							prejoinPageEnabled: false, // we want to skip confirming displayName
						}
					}
				}
			})

			// wait for the connection
			await connection
		})
	}

	/**
	 * Disconnect from jitsi conference
	 */
	async disconnect() {
		// disconnect through webview while showing progressbar
		return vscode.window.withProgress({
			location: { viewId: VIEW_ID },
			title: 'Disconnecting'
		}, async () => {
			// create a promise from event
			const disconnection = new Promise(res => this.once(DISCONNECTED_EVENT, () => res()))

			// send disconnection request to webview
			await this.view.webview.postMessage({ type: DISCONNECT_REQUEST })

			// wait for disconnection
			await disconnection
		})
	}

	/**
	 * Activates the extension
	 * @param {vscode.ExtensionContext} context Extension context provided by vscode
	 */
	activate(context) {
		this.context = context

		// register commands
		const disposeConnectCommand = vscode.commands.registerCommand(CONNECT_COMMAND, this.connect, this)
		const disposeDisconnectCommand = vscode.commands.registerCommand(DISCONNECT_COMMAND, this.disconnect, this)

		// register the webview
		const disposeViewProvider = vscode.window.registerWebviewViewProvider(VIEW_ID, {
			resolveWebviewView: (view) => {
				this.view = view

				// setup a handler for the event emitter
				view.webview.onDidReceiveMessage(event => this.emit(event.type, event.payload))

				// configure the webview
				view.webview.options = {
					enableScripts: true, // jitsi needs javascript
					enableCommandUris: true, // to directly call commands from webview
					localResourceRoots: [
						vscode.Uri.file(path.join(this.context.extensionPath, 'out/public'))
					], // we'd like to provide static files from public directory
				}

				// set webview's html
				view.webview.html = getWebviewContent(this.context, view.webview)
			}
		}, {
			webviewOptions: {
				retainContextWhenHidden: true // we don't want to terminate the call if user closes the webview
			}
		})

		// context value handlers to enable/disable commands appropriately
		vscode.commands.executeCommand(SET_CONTEXT_COMMAND, CONNECTED_CONTEXT, false)

		// connected handler
		this.on(CONNECTED_EVENT, ({ roomName }) => {
			// update context
			vscode.commands.executeCommand(SET_CONTEXT_COMMAND, CONNECTED_CONTEXT, true)
			// update lastUsedRooName
			this.context.workspaceState.update(LAST_USED_ROOM_NAME, roomName)
		})

		// connection failed handler
		this.on(CONNECTION_FAILED_EVENT, ({ roomName }) => {
			// update context
			vscode.commands.executeCommand(SET_CONTEXT_COMMAND, CONNECTED_CONTEXT, false)
			// alert user
			vscode.window.showErrorMessage(`Could not connect to ${roomName}`)
		})

		// disconnected handler
		this.on(DISCONNECTED_EVENT, () => {
			// update context
			vscode.commands.executeCommand(SET_CONTEXT_COMMAND, CONNECTED_CONTEXT, false)
		})

		// notification handler
		this.on(NOTIFICATION_EVENT, ({ args }) => {
			// show information message from vscode
			vscode.window.showInformationMessage(...args)
		})

		// handle password request
		this.on(PASSWORD_REQUIRED_EVENT, async () => {
			// request password
			const password = await vscode.window.showInputBox({
				ignoreFocusOut: true,
				password: true,
				prompt: 'Enter the room password.'
			})
			// abort if password is empty or inputBox is closed
			if (!password) {
				vscode.window.showErrorMessage('Password is required. Disconected.')
				await this.disconnect()
			}
			// send password request to webview
			this.view.webview.postMessage({
				type: PASSWORD_REQUEST,
				payload: { password }
			})
		})

		// cleanup
		context.subscriptions.push(disposeConnectCommand, disposeDisconnectCommand, disposeViewProvider)
	}

	/**
	 * Deactivate the extension
	 */
	deactivate() {
		// decommission the listeners
		this.removeAllListeners()
	}
}

let extension;

export function activate(context) {
	extension = new Extension()
	extension.activate(context)
}
export function deactivate() {
	extension.deactivate()
}
