<script>
    import state, { unmute, mute } from "../store";
    import { notify } from "../portal";
    import { icon } from "@fortawesome/fontawesome-svg-core";
    import {
        faMicrophone,
        faMicrophoneSlash,
        faCopy,
    } from "@fortawesome/free-solid-svg-icons";

    const connectedMicrophone = icon(faMicrophone, {
        styles: { width: "32px", height: "32px", margin: "4px" },
    }).html;
    const disconnectedMicrophone = icon(faMicrophoneSlash, {
        styles: { width: "40px", height: "40px" },
    }).html;
    const copyIcon = icon(faCopy, {
        styles: { width: "1rem", height: "1rem" },
    }).html;
    const copyRoomName = () => {
        navigator.clipboard.writeText($state.roomName);
        notify(`Copied room name (${$state.roomName}) to clipboard.`);
    };
    const copyPassword = () => {
        navigator.clipboard.writeText($state.password);
        notify(`Copied password to clipboard.`);
    };
</script>

<style type="text/scss">
    .controls {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .mic.connected {
        border: 2px solid transparent;
        border-radius: 50%;
        background-color: var(--vscode-button-hoverBackground);
        color: var(--vscode-sideBar-background);
        padding: 8px;
        outline: none;
        cursor: pointer;

        &.muted {
            border-color: var(--vscode-button-hoverBackground);
            background-color: transparent;
            color: var(--vscode-button-hoverBackground);
        }
    }
    .control {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        padding: 4px;
        border: 1px solid var(--vscode-foreground);
        > input {
            color: var(--vscode-foreground);
            background: transparent;
            border: none;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
        }
        > .copy-icon {
            cursor: pointer;
            color: var(--vscode-foreground);
        }
        &.room-name {
            margin: 12px 0;
        }
    }
</style>

<div class="controls">
    {#if $state.connected && $state.password}
        <h2>Connected</h2>
        <br />
        <button
            class="mic"
            class:connected={$state.connected && $state.password}
            class:muted={$state.muted}
            on:mousedown={unmute}
            on:mouseup={mute}
            on:mouseleave={mute}
            disabled={!$state.connected || !$state.password}>
            {#if $state.connected && $state.password && !$state.muted}
                {@html connectedMicrophone}
            {:else}
                {@html disconnectedMicrophone}
            {/if}
        </button>
        <br />
        <div class="control room-name">
            <input value={$state.roomName} disabled />
            <span
                class="copy-icon"
                on:click={copyRoomName}>{@html copyIcon}</span>
        </div>
        <div class="control">
            <input type="password" value={$state.password} disabled />
            <span
                class="copy-icon"
                on:click={copyPassword}>{@html copyIcon}</span>
        </div>
    {:else}
        <h2>Ready to connect</h2>
        <h3>How to connect:</h3>
        <ol>
            <li>Click Connect</li>
            <li>
                Enter a room name of your choice. When prompted, you can keep
                the input empty to have a randomly generated room name.
            </li>
            <li>
                Enter the room's password. You should choose a strong memorable
                password.
            </li>
        </ol>
        <h3>Push to Talk:</h3>
        <ul>
            <li>You can <b>Hold the microphone button</b> and speak</li>
            <li>
                Or if the extension view is active, you can
                <b>hold spacebar</b>
                while you speak
            </li>
        </ul>
    {/if}
</div>
