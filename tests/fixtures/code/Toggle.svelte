<script>
	export let on = false;
	$: label = on ? 'On' : 'Off';
</script>

<button class:on on:click={() => (on = !on)}>
	{#if on}✓{/if} {label}
</button>

<style>
	.on { color: green; }
</style>
