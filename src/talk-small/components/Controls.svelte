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
    .mic {
        border: 2px solid var(--vscode-activityBar-inactiveForeground);
        border-radius: 50%;
        background-color: transparent;
        color: var(--vscode-activityBar-inactiveForeground);
        padding: 8px;
        outline: none;

        &.connected {
            border-color: transparent;
            background-color: var(--vscode-button-hoverBackground);
            color: var(--vscode-sideBar-background);
            cursor: pointer;

            &.muted {
                border-color: var(--vscode-button-hoverBackground);
                background-color: transparent;
                color: var(--vscode-button-hoverBackground);
            }
        }
    }
    .control {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        background-color: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border: 1px solid var(--vscode-input-border);
        padding: 4px;
        > input {
            background: transparent;
            border: none;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
        }
        > .copy-icon {
            cursor: pointer;
            color: var(--vscode-input-foreground);
            &:hover {
                color: var(--vscode-activityBar-foreground);
            }
        }
        &.room-name {
            margin: 12px 0;
        }
    }
</style>

<div class="controls">
    <button
        class="mic"
        class:connected={$state.connected}
        class:muted={$state.muted}
        on:mousedown={unmute}
        on:mouseup={mute}
        on:mouseleave={mute}
        disabled={!$state.connected}>
        {#if $state.connected && !$state.muted}
            {@html connectedMicrophone}
        {:else}
            {@html disconnectedMicrophone}
        {/if}
    </button>
    {#if $state.connected && $state.password}
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
    {/if}
</div>
