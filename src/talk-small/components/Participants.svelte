<script>
    import state from "../store";
</script>

<style type="text/scss">
    ul {
        list-style: none;
        padding: 0;
        display: flex;
        flex-direction: column;
        align-content: stretch;
        > .participant {
            padding: 4px;
            color: var(--vscode-list-hoverForeground);
            border: 2px solid var(--vscode-list-hoverBackground);
            &.participant.highlighted {
                border-color: transparent;
                background-color: var(--vscode-list-hoverBackground);
            }
        }
    }
</style>

<ul>
    {#each $state.participants as participant}
        <li
            class="participant"
            class:highlighted={participant.formattedDisplayName.endsWith('(me)')}>
            <span>{participant.formattedDisplayName}</span>
        </li>
    {/each}
</ul>
