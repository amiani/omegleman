<script lang="ts">
	import type Session from '$lib/Session'
	import Chat from "$lib/components/Chat.svelte"
	export let session: Session
</script>

<div class="flex flex-col border-2 rounded-md">
	<!-- svelte-ignore a11y-media-has-caption -->
	<video autoplay />
	<!-- svelte-ignore a11y-media-has-caption -->
	<video autoplay />
	<Chat />
</div>