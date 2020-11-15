import {
    CONNECT_REQUEST,
    DISCONNECT_REQUEST,
    CONNECTED_RESPONSE,
    CONNECTION_FAILED_RESPONSE,
    DISCONNECTED_RESPONSE,
    INITIALIZED_RESPONSE
} from '../constants'
import store from './store'

// extension
const vscode = acquireVsCodeApi()

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
            }
        }
    })

    // emit initialized event when the page is loaded
    window.addEventListener('load', () => vscode.postMessage({ type: INITIALIZED_RESPONSE }))
}
