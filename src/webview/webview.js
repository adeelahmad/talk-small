import {
    CONNECTED_RESPONSE,
    CONNECT_REQUEST,
    DISCONNECTED_RESPONSE,
    DISCONNECT_REQUEST,
    INITIALIZED_RESPONSE,
    TOGGLE_AUDIO_COMMAND,
    VIDEO_CONFERENCE_JOINED_EVENT
} from '../constants'

// state
let api = null
let connected = false
let muted = true

// elements
let containerDiv = null
let toggleButton = null

// extension
// eslint-disable-next-line no-undef
const vscode = acquireVsCodeApi()

// connects to jitsi conference
const connect = ({ domain, options }) => {
    if (!connected) {
        // eslint-disable-next-line no-undef
        api = new JitsiMeetExternalAPI(
            domain,
            { ...options, parentNode: containerDiv }
        )
        api.once(VIDEO_CONFERENCE_JOINED_EVENT, ({ roomName }) => {
            connected = true
            muted = true
            toggleButton.disabled = false
            vscode.postMessage({ type: CONNECTED_RESPONSE, payload: { roomName } })
        })
    }
}

// disconnects from jitsi conference
const disconnect = () => {
    if (connected) {
        api.dispose()
        api = null
        connected = false
        muted = true
        toggleButton.disabled = true
        vscode.postMessage({ type: DISCONNECTED_RESPONSE })
    }
}

// turn on mic
// eslint-disable-next-line no-unused-vars
const unmute = () => {
    if (connected && muted) {
        api.executeCommand(TOGGLE_AUDIO_COMMAND)
        muted = false
    }
}

// turn off mic
// eslint-disable-next-line no-unused-vars
const mute = () => {
    if (connected && !muted) {
        api.executeCommand('toggleAudio')
        muted = true
    }
}

// register dom elements
window.onload = () => {
    containerDiv = document.querySelector('#container')
    toggleButton = document.querySelector('#toggle')
    vscode.postMessage({ type: INITIALIZED_RESPONSE })
}

// register extension event handlers
window.addEventListener('message', ({ data }) => {
    if (data) {
        switch (data.type) {
            case CONNECT_REQUEST: return connect(data.payload)
            case DISCONNECT_REQUEST: return disconnect(data.payload)
        }
    }
})
