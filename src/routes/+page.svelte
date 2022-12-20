<script lang="ts">
	import ControlBar from "$lib/components/ControlBar.svelte"
	import SessionPane from "$lib/components/SessionPane.svelte"
	import type { Session } from "$lib/Session"
  import Omegle from '$lib/Omegle'
  import settings from '$lib/settings'
  import { onMount } from 'svelte';

	export const ssr = false
	export const prerender = false

	let omegle: Omegle
	let sessions: Session[] = []

	onMount(async () => {
		omegle = await Omegle.create(settings)
		pollEvents()
	})

	async function startSession() {
		const session = await omegle.startSession(settings, handleRemoteStream, handleSessionDisconnect)
			.catch(err => console.log(`Error starting session: ${err}`))
		if (session) {
			sessions = sessions.concat(session)
		}
	}

	function handleRemoteStream(_: MediaStream) {
		sessions = sessions
	}

	function handleSessionDisconnect(id: string) {
		const index = sessions.findIndex(session => session.id === id)
		sessions.splice(index, 1)
		sessions = sessions
	}

	async function pollEvents() {
		for (const session of sessions) {
			const events = await omegle.getEvents(session)
			session.handleEvents(events, omegle)
		}
		setTimeout(pollEvents, 0)
	}
</script>

<main class="">
	<ControlBar handleNewSession={startSession} />
	<div class="flex">
		{#each sessions as session}
			<SessionPane session={session} />
		{/each}
	</div>
</main>
