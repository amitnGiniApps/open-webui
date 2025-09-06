<script lang="ts">
	import { onMount } from 'svelte'

	let remoteBtn: HTMLButtonElement | null = null

	onMount(async () => {
		try {
			// Import the remote (this should render into #root or #mlrun-root)
			await import('mlrun/app')
				.then((module) => {
					console.log('Remote module loaded:', module);
				})
				.catch((err) => {
					console.error('Error loading remote module:', err);
				});

			// Give it a moment to render before we query the DOM
			setTimeout(() => {
				const remoteContainer = document.getElementById('root') || document.getElementById('mlrun-root')

				if (remoteContainer) {
					// Print out everything the remote rendered
					console.log('Remote HTML:\n', remoteContainer.innerHTML)

					// Find the button
					remoteBtn = remoteContainer.querySelector('#remote-btn') as HTMLButtonElement | null

					if (remoteBtn) {
						console.log('Found remote button with id:', remoteBtn.id)
					} else {
						console.warn('Remote button not found in remote HTML')
					}
				}
			}, 500)
		} catch (err) {
			console.error('Failed to load remote app:', err)
		}
	})

	function clickRemoteButton() {
		if (remoteBtn) {
			console.log('Clicking remote button with id:', remoteBtn.id)
			remoteBtn.click()
		} else {
			console.warn('Remote button not available')
		}
	}
</script>

<main>

	<h1>Vite + Svelte (Host)</h1>


	<h2>Remote (React) below</h2>
	<div id="mlrun-root" class="remote-slot"></div>
	<div id="root" class="remote-slot"></div>

	<!-- Host button to trigger the remote one -->
	<button on:click={clickRemoteButton}>
		Print Remote HTML & Click Remote Button
	</button>
</main>

<style>
    .logo {
        height: 6em;
        padding: 1.5em;
        will-change: filter;
        transition: filter 300ms;
    }
    .logo:hover {
        filter: drop-shadow(0 0 2em #646cffaa);
    }
    .logo.svelte:hover {
        filter: drop-shadow(0 0 2em #ff3e00aa);
    }
    .remote-slot {
        border: 1px dashed #ccc;
        padding: 12px;
        margin-top: 12px;
        min-height: 80px;
    }
</style>
