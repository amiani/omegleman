<script lang="ts">
	import type { Session } from '$lib/Session'
	import Chat from "$lib/components/Chat.svelte"
  import { afterUpdate, beforeUpdate, onMount } from 'svelte';
	export let session: Session

	let remoteVideo: HTMLVideoElement
	let localVideo: HTMLVideoElement

	onMount(() => {
		localVideo.srcObject = session.localStream
	})

	afterUpdate(() => {
		if (session.remoteStream) {
			console.log('setting remote stream')
			remoteVideo.srcObject = session.remoteStream
		}
	})
</script>

<section class="flex flex-col border-2 rounded-md">
	<!-- svelte-ignore a11y-media-has-caption -->
	<video autoplay bind:this={remoteVideo} />
	<!-- svelte-ignore a11y-media-has-caption -->
	<video autoplay bind:this={localVideo} />
	<Chat />
</section>