import {
    CONNECT_REQUEST,
    DISCONNECT_REQUEST,
    CONNECTED_RESPONSE,
    CONNECTION_FAILED_RESPONSE,
    DISCONNECTED_RESPONSE,
    INITIALIZED_RESPONSE,
    NOTIFICATION_RESPONSE,
    PASSWORD_REQUEST,
    PASSWORD_SET_RESPONSE,
    PASSWORD_REQUIRED_RESPONSE
} from '../constants'

// extension
const vscode = acquireVsCodeApi()

import store from './store'

export function requirePassword() {
    vscode.postMessage({ type: PASSWORD_REQUIRED_RESPONSE })
}

export function notify(...args) {
    vscode.postMessage({ type: NOTIFICATION_RESPONSE, payload: { args } })
}

export function initializeWindow() {
    // register extension event handlers
    window.addEventListener('message', async ({ data }) => {
        if (data) {
            switch (data.type) {
                case CONNECT_REQUEST: {
                    try {
                        const payload = await store.connect(data.payload)
                        return vscode.postMessage({ type: CONNECTED_RESPONSE, payload })
                    } catch (error) {
                        return vscode.postMessage({ type: CONNECTION_FAILED_RESPONSE, payload: error })
                    }
                }
                case DISCONNECT_REQUEST: {
                    await store.disconnect(data.payload)
                    return vscode.postMessage({ type: DISCONNECTED_RESPONSE })
                }
                case PASSWORD_REQUEST: {
                    await store.password(data.payload)
                    return vscode.postMessage({ type: PASSWORD_SET_RESPONSE })
                }
            }
        }
    })

    // emit initialized event when the page is loaded
    window.addEventListener('load', () => vscode.postMessage({ type: INITIALIZED_RESPONSE }))
}
