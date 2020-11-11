const vscode = require('vscode')
const path = require('path')
const fs = require('fs')
const { EventEmitter } = require('events')

class Extension extends EventEmitter {
	constructor() {
		super()
		this.view = null
	}

	// connect to jitsi conference
	connect() {
		if (!this.view) {
			this.once('initialized', () => this.connect())
			vscode.commands.executeCommand('talk-small.focus')
			return
		}
		vscode.window.withProgress({
			location: { viewId: 'talk-small' },
			title: 'Connecting'
		}, () => {
			const connected = new Promise(res => this.once('connected', () => res()))
			this.view.webview.postMessage({
				type: 'connect',
				payload: {
					domain: 'meet.jit.si',
					options: {
						roomName: 'TalkSmallExtensionCall',
						configOverwrite: {
							startAudioOnly: true,
							startWithAudioMuted: true,
							prejoinPageEnabled: false
						}
					}
				}
			})
			return connected
		})
	}

	// disconnect from jitsi conference
	disconnect() {
		vscode.window.withProgress({
			location: { viewId: 'talk-small' },
			title: 'Disconnecting'
		}, () => {
			const disconnected = new Promise(res => this.once('disconnected', () => res()))
			this.view.webview.postMessage({ type: 'disconnect' })
			return disconnected
		})
	}

	// activate the extension
	activate(context) {
		// register commands
		const disposeConnectCommand = vscode.commands.registerCommand('talk-small.connect', this.connect, this)
		const disposeDisconnectCommand = vscode.commands.registerCommand('talk-small.disconnect', this.disconnect, this)

		// load webview's html
		const html = fs.readFileSync(path.join(context.extensionPath, 'static', 'index.html'), 'utf-8')

		// register the webview
		const disposeViewProvider = vscode.window.registerWebviewViewProvider('talk-small', {
			resolveWebviewView: (view) => {
				this.view = view
				view.webview.onDidReceiveMessage((event) => this.emit(event.type, event.payload))
				view.webview.options = {
					enableScripts: true,
					enableCommandUris: true,
					localResourceRoots: []
				}
				view.webview.html = html
			}
		}, { webviewOptions: { retainContextWhenHidden: true } })

		// context value handlers to enable/disable commands appropriately
		vscode.commands.executeCommand('setContext', 'talk-small:connected', false)
		this.on('connected', () => vscode.commands.executeCommand('setContext', 'talk-small:connected', true))
		this.on('disconnected', () => vscode.commands.executeCommand('setContext', 'talk-small:connected', false))

		// cleanup
		context.subscriptions.push(disposeConnectCommand, disposeDisconnectCommand, disposeViewProvider)
	}

	// deactivate the extension
	deactivate() { }
}

const extension = new Extension()

module.exports = {
	activate: (context) => extension.activate(context),
	deactivate: () => { }
}
