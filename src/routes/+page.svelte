<script lang="ts">
	import ControlBar from "$lib/components/ControlBar.svelte"
	import SessionPane from "$lib/components/SessionPane.svelte"
	import type { Session } from "$lib/Session"
  import Omegle from '$lib/Omegle'
  import settings from '$lib/settings'
  import { onMount } from 'svelte';

	export const ssr = false

	let omegle: Omegle
	const sessions: Session[] = []

	onMount(async () => {
		omegle = await Omegle.create(settings)
		setInterval(async () => {
			for (const session of sessions) {
				const events = await omegle.pollEvents(session)
				session.handleEvents(events, omegle)
			}
		}, 1)
	})

	async function startSession() {
		const session = await omegle.startSession(settings)
		sessions.push(session)
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
