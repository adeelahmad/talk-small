import './main.css'

import App from './components/App.svelte'

import {initializeWindow} from './portal'

// setup window event listeners to communicate with vscode
initializeWindow()

// render app
new App({ target: document.body })
