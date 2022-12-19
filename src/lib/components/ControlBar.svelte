<script lang="ts">
	export let handleNewSession: () => void
</script>

<header class="w-full shadow-lg">
	<button class="" on:click={handleNewSession}>New</button>
</header>