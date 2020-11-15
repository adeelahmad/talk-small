<script>
    import state, { unmute, mute } from "../store";
    import { icon } from "@fortawesome/fontawesome-svg-core";
    import {
        faMicrophone,
        faMicrophoneSlash,
    } from "@fortawesome/free-solid-svg-icons";

    const iconScale = 20;
    const connectedMicrophone = icon(faMicrophone, {
        styles: {
            width: `${(iconScale * 8) / 5}px`,
            height: `${(iconScale * 8) / 5}px`,
            margin: `${iconScale / 5}px`,
        },
    }).html;
    const disconnectedMicrophone = icon(faMicrophoneSlash, {
        styles: {
            width: `${iconScale * 2}px`,
            height: `${iconScale * 2}px`,
        },
    }).html;
</script>

<style>
    * {
        box-sizing: border-box;
        cursor: default;
    }
    main {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 16px;
    }
    .mic {
        border: 2px solid var(--vscode-activityBar-inactiveForeground);
        border-radius: 50%;
        background-color: transparent;
        color: var(--vscode-activityBar-inactiveForeground);
        padding: 8px;
        outline: none;
    }
    .mic.connected {
        border-color: transparent;
        background-color: var(--vscode-button-hoverBackground);
        color: var(--vscode-sideBar-background);
        cursor: pointer;
    }
    .mic.connected.muted {
        border-color: var(--vscode-button-hoverBackground);
        background-color: transparent;
        color: var(--vscode-button-hoverBackground);
    }
    ul {
        list-style: none;
        padding: 0
    }
</style>

<main>
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
    {#if $state.connected}
        <ul>
            <li><h3>Participants</h3></li>
            {#each $state.participants as participant}
                <li>{participant.formattedDisplayName}</li>
            {/each}
        </ul>
    {/if}
</main>

<svelte:window
    on:keydown={(e) => e.key === ' ' && unmute()}
    on:keyup={(e) => $state.connected && e.key === ' ' && mute()} />
