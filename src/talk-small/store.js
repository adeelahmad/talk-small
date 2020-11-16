import {
    TOGGLE_AUDIO_COMMAND,
    VIDEO_CONFERENCE_JOINED_EVENT,
    CONNECTION_TIMEOUT,
    PARTICIPANT_JOINED_EVENT,
    PARTICIPANT_KICKED_OUT_EVENT,
    PARTICIPANT_LEFT_EVENT,
    DISPLAY_NAME_CHANGE_EVENT,
    PARTICIPANT_ROLE_CHANGED_EVENT,
    PASSWORD_REQUIRED_EVENT,
    PASSWORD_COMMAND
} from '../constants'

import { writable } from 'svelte/store'
import { produce } from 'immer'
import { requirePassword } from './portal'

// create state
const initialState = {
    api: null,
    connected: false,
    muted: true,
    roomName: null,
    password: null,
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
    const connected = ({ roomName }) => update(produce(state => {
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

    // handle role change (aka set password by moderator)
    const roleChanged = ({ role }) => {
        update(produce(state => {
            if (role === 'moderator' && !state.password) requirePassword()
        }))
    }

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
            state.api.on(PARTICIPANT_ROLE_CHANGED_EVENT, roleChanged)
            state.api.on(PASSWORD_REQUIRED_EVENT, requirePassword)
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

export const password = async ({password}) => update(produce(state => {
    state.password = password
    state.api.executeCommand(PASSWORD_COMMAND, password)
}))

export default {
    subscribe,
    connect,
    disconnect,
    unmute,
    mute,
    password
}
