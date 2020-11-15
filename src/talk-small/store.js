import {
    TOGGLE_AUDIO_COMMAND,
    VIDEO_CONFERENCE_JOINED_EVENT,
    CONNECTION_TIMEOUT,
    PARTICIPANT_JOINED_EVENT,
    PARTICIPANT_KICKED_OUT_EVENT,
    PARTICIPANT_LEFT_EVENT,
    DISPLAY_NAME_CHANGE_EVENT
} from '../constants'

import { writable } from 'svelte/store'
import { produce } from 'immer'

// create state
const initialState = {
    api: null,
    connected: false,
    muted: true,
    roomName: null,
    participants: []
}

// create store
const { subscribe, update } = writable(initialState)

// add timeouts to event listeners
const onceWithTimeout = (emitter, event, timeout) => new Promise((res, rej) => {
    const timer = setTimeout(() => {
        emitter.off(event, res)
        rej()
    }, timeout)
    emitter.once(event, (value) => {
        clearTimeout(timer)
        res(value)
    })
})

// connects to jitsi conference
export const connect = ({ domain, options }) => new Promise((res, rej) => {
    // handle connection success
    const connected = ({ roomName, id }) => update(produce(state => {
        state.connected = true
        state.muted = true
        state.roomName = roomName
        res({ roomName })
    }))

    // handle connection failure
    const connectionFailed = () => update(state => {
        state.api.dispose()
        rej({ roomName: options.roomName })
        return initialState
    })

    // handle participation change
    const participationChanged = () => update(produce(state => {
        state.participants = state.api.getParticipantsInfo()
            .reduce((ps, p) => {
                if (p.formattedDisplayName.endsWith('(me)')) ps.unshift(p)
                else ps.push(p)
                return ps
            }, [])
            .map(({ formattedDisplayName }) => ({ formattedDisplayName }))
    }))

    // try connecting
    update(produce(state => {
        if (!state.connected) {
            state.api = new JitsiMeetExternalAPI(
                domain,
                { ...options, parentNode: document.getElementById('container') }
            )
            state.api.on(VIDEO_CONFERENCE_JOINED_EVENT, participationChanged)
            state.api.on(PARTICIPANT_JOINED_EVENT, participationChanged)
            state.api.on(PARTICIPANT_KICKED_OUT_EVENT, participationChanged)
            state.api.on(PARTICIPANT_LEFT_EVENT, participationChanged)
            state.api.on(DISPLAY_NAME_CHANGE_EVENT, participationChanged)
            onceWithTimeout(state.api, VIDEO_CONFERENCE_JOINED_EVENT, CONNECTION_TIMEOUT)
                .then(connected)
                .catch(connectionFailed)
        }
    }))
})

// disconnects from jitsi conference
export const disconnect = async () => {
    update(state => {
        if (state.connected) {
            state.api.dispose()
            return initialState
        }
        return state
    })
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
