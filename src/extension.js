import * as vscode from 'vscode'
import webviewHtml from 'webview:talk-small'
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
	CONNECTED_CONTEXT
} from './constants'

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

		// connect through webview while showing progress
		return vscode.window.withProgress({
			location: { viewId: VIEW_ID },
			title: 'Connecting'
		}, async () => {
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

			// create promise from event
			const connection = new Promise(res => this.once(CONNECTED_EVENT, () => res()))

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
					localResourceRoots: [] // we don't need any local extension files in webview
				}

				// set webview's html
				view.webview.html = webviewHtml
			}
		}, {
			webviewOptions: {
				retainContextWhenHidden: true // we don't want to terminate the call if user closes the webview
			}
		})

		// context value handlers to enable/disable commands appropriately
		vscode.commands.executeCommand(SET_CONTEXT_COMMAND, CONNECTED_CONTEXT, false)
		this.on(CONNECTED_EVENT, () => vscode.commands.executeCommand(SET_CONTEXT_COMMAND, CONNECTED_CONTEXT, true))
		this.on(DISCONNECTED_EVENT, () => vscode.commands.executeCommand(SET_CONTEXT_COMMAND, CONNECTED_CONTEXT, false))

		// lastUsedRooName update handler
		this.on(CONNECTED_EVENT, ({ roomName }) => this.context.workspaceState.update(LAST_USED_ROOM_NAME, roomName))

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
