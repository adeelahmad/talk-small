import { TOGGLE_AUDIO_COMMAND, VIDEO_CONFERENCE_JOINED_EVENT } from '../../constants'

import { writable } from 'svelte/store'
import { produce } from 'immer'

// create state
const initialState = { api: null, connected: false, muted: true, roomName: null }

// create store
const { subscribe, update } = writable(initialState)

// add timeouts to event listeners
const onceWithTimeout = (emitter, event, timeout) => new Promise((res, rej) => {
    const timer = setTimeout(() => {
        emitter.off(event, res)
        rej({ timeout })
    }, timeout)
    emitter.once(event, (value) => {
        clearTimeout(timer)
        res(value)
    })
})

// connects to jitsi conference
export const connect = ({ domain, options }) => new Promise((res, rej) => {
    // handle connection success
    const connected = ({ roomName }) => update(produce(state => {
        state.connected = true
        state.muted = true
        state.roomName = roomName
        res({ roomName })
    }))

    // handle connection failure
    const connectionFailed = (error) => update(produce(state => {
        state.api.dispose()
        state = initialState
        rej(error)
    }))

    // try connecting
    update(produce(state => {
        if (!state.connected) {
            state.api = new JitsiMeetExternalAPI(
                domain,
                { ...options, parentNode: document.getElementById('container') }
            )
            onceWithTimeout(state.api, VIDEO_CONFERENCE_JOINED_EVENT, 30000)
                .then(connected)
                .catch(connectionFailed)
        }
    }))
})

// disconnects from jitsi conference
export const disconnect = async () => {
    update(produce(state => {
        if (state.connected) {
            state.api.dispose()
            state = initialState
        }
    }))
}

// turn on mic
export const unmute = () => update(produce(state => {
    if (state.connected && state.muted) {
        state.api.executeCommand(TOGGLE_AUDIO_COMMAND)
        state.muted = false
    }
}))

// turn off mic
export const mute = () => update(produce(state => {
    if (state.connected && !state.muted) {
        state.api.executeCommand(TOGGLE_AUDIO_COMMAND)
        state.muted = true
    }
}))

export default {
    subscribe,
    connect,
    disconnect,
    unmute,
    mute
}
