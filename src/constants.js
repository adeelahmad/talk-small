// globals
export const EXTENSION_ID = 'talk-small'
export const VIEW_CONTAINER_ID = 'talk-small'
export const VIEW_ID = 'talk-small'

// configuration
export const CONFIG_SECTION = EXTENSION_ID
export const DISPLAY_NAME = 'displayName'

// vscode commands
export const CONNECT_COMMAND = `${EXTENSION_ID}.connect`
export const DISCONNECT_COMMAND = `${EXTENSION_ID}.disconnect`
export const FOCUS_COMMAND = `${VIEW_ID}.focus`
export const SET_CONTEXT_COMMAND = 'setContext'

// contexts
export const CONNECTED_CONTEXT = `${EXTENSION_ID}:connected`

// webview requests
export const CONNECT_REQUEST = 'connect'
export const DISCONNECT_REQUEST = 'disconnect'
export const PASSWORD_REQUEST = 'password'

// extension events (nodejs ones)
export const INITIALIZED_EVENT = 'initialized'
export const CONNECTED_EVENT = 'connected'
export const CONNECTION_FAILED_EVENT = 'connectionFailed'
export const DISCONNECTED_EVENT = 'disconnected'
export const NOTIFICATION_EVENT = 'notification'
export const PASSWORD_SET_EVENT = 'passwordSet'

// workspace state
export const LAST_USED_ROOM_NAME = 'lastUsedRoomName'

// jitsi events
export const VIDEO_CONFERENCE_JOINED_EVENT = 'videoConferenceJoined'
export const PARTICIPANT_JOINED_EVENT = 'participantJoined'
export const PARTICIPANT_KICKED_OUT_EVENT = 'participantKickedOut'
export const PARTICIPANT_LEFT_EVENT = 'participantLeft'
export const DISPLAY_NAME_CHANGE_EVENT = 'displayNameChange'
export const PARTICIPANT_ROLE_CHANGED_EVENT = 'participantRoleChanged'
export const PASSWORD_REQUIRED_EVENT = 'passwordRequired'

// jitsi commands
export const TOGGLE_AUDIO_COMMAND = 'toggleAudio'
export const PASSWORD_COMMAND = 'password'

// webview responses
export const INITIALIZED_RESPONSE = INITIALIZED_EVENT
export const CONNECTED_RESPONSE = CONNECTED_EVENT
export const CONNECTION_FAILED_RESPONSE = CONNECTION_FAILED_EVENT
export const DISCONNECTED_RESPONSE = DISCONNECTED_EVENT
export const NOTIFICATION_RESPONSE = NOTIFICATION_EVENT
export const PASSWORD_REQUIRED_RESPONSE = PASSWORD_REQUIRED_EVENT
export const PASSWORD_SET_RESPONSE = PASSWORD_SET_EVENT

// connection settings
export const CONNECTION_TIMEOUT = 30000
