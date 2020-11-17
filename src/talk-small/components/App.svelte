<script>
    import state, { unmute, mute } from "../store";
    import Controls from "./Controls.svelte";
    import Participants from "./Participants.svelte";
</script>

<style type="text/scss">
    main {
        padding: 16px;
    }
    .attribution {
        padding-top: 8px;
        text-align: center;
        > a {
            color: var(--vscode-textLink-foreground);
        }
    }
</style>

<main>
    <Controls />
    {#if $state.connected && $state.password}
        <Participants />
    {/if}
    <br />
    <div class="attribution">
        Powered by
        <a href="https://meet.jit.si">Jitsi</a>
    </div>
</main>

<svelte:window
    on:keydown={(e) => e.key === ' ' && unmute()}
    on:keyup={(e) => $state.connected && e.key === ' ' && mute()} />
