<script>
    import state, { unmute, mute } from "../store";

    import { CONNECT_COMMAND, DISCONNECT_COMMAND } from "../../../constants";
</script>

<div id="container" style="display: none"></div>

<div>Still Monumental Ugly UI</div>
<a href="command:{CONNECT_COMMAND}">Connect</a>
<button
    on:mousedown={unmute}
    on:mouseup={mute}
    on:mouseleave={mute}
    disabled={!$state.connected}>
    PTT
</button>
<a href="command:{DISCONNECT_COMMAND}">Disonnect</a>
