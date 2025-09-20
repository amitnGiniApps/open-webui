<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { showMlrun, showControls } from '$lib/stores';
	import ArrowsPointingOut from '../icons/ArrowsPointingOut.svelte';
	import XMark from '../icons/XMark.svelte';
	import Tooltip from '../common/Tooltip.svelte';
	import { getContext } from 'svelte';

	const i18n = getContext('i18n');
	const dispatch = createEventDispatcher();

	export let overlay = false;

	let rootContainer: HTMLDivElement | null = null;
	let mounted = false;
	let remoteApp: any = null;

	// ✅ Utility: wait until element exists in DOM
	function waitForElement(selector: string, timeout = 5000): Promise<Element> {
		return new Promise((resolve, reject) => {
			const interval = 100;
			let elapsed = 0;

			const check = () => {
				const el = document.querySelector(selector);
				if (el) {
					resolve(el);
				} else {
					elapsed += interval;
					if (elapsed >= timeout) {
						reject(new Error(`Timeout waiting for ${selector}`));
					} else {
						setTimeout(check, interval);
					}
				}
			};
			check();
		});
	}

	// ✅ Native value setter (so React updates its state)
	function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
		const { set: valueSetter } = Object.getOwnPropertyDescriptor(element, "value") || {};
		const prototype = Object.getPrototypeOf(element);
		const { set: prototypeValueSetter } = Object.getOwnPropertyDescriptor(prototype, "value") || {};

		if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
			prototypeValueSetter.call(element, value);
		} else if (valueSetter) {
			valueSetter.call(element, value);
		} else {
			throw new Error("Unable to set value on element");
		}
	}

	// ✅ Ensure title respects restrictions
	function makeValidProjectName(name: string): string {
		let valid = name.toLowerCase();
		valid = valid.replace(/[^a-z0-9-]/g, "-");
		if (!/^[a-z]/.test(valid)) valid = "a" + valid;
		if (!/[a-z0-9]$/.test(valid)) valid = valid + "0";
		if (valid.length > 63) valid = valid.substring(0, 63);
		return valid;
	}

	function fillAndSubmitProjectForm(name: string, description: string) {
		const projectName = makeValidProjectName(name);

		// 1. Fill "Name"
		const nameInput = document.querySelector<HTMLInputElement>('[data-testid="name-form-input"]');
		if (nameInput) {
			setNativeValue(nameInput, projectName);
			nameInput.dispatchEvent(new Event("input", { bubbles: true }));
			nameInput.dispatchEvent(new Event("change", { bubbles: true }));
			nameInput.focus(); // keep focused
			console.log("✅ Filled valid name:", projectName);
		} else {
			console.error("❌ Name input not found");
		}

		// 2. Fill "Description"
		const descInput = document.querySelector<HTMLTextAreaElement>('[data-testid="textarea"]');
		if (descInput) {
			setNativeValue(descInput, description);
			descInput.dispatchEvent(new Event("input", { bubbles: true }));
			descInput.dispatchEvent(new Event("change", { bubbles: true }));
			console.log("✅ Filled description:", description);
		} else {
			console.error("❌ Description textarea not found");
		}

		// 3. Delay Create button click
		setTimeout(() => {
			const createBtn = Array.from(document.querySelectorAll('[data-testid="btn"]'))
				.find(btn => btn.textContent?.trim() === "Create");

			if (createBtn instanceof HTMLElement) {
				createBtn.click();
				console.log("🚀 Create button clicked after delay!");
			} else {
				console.error("❌ Create button not found");
			}
		}, 800);
	}

	function clickNewProjectButton() {
		const buttons = document.querySelectorAll('[data-testid="btn"]');
		const target = Array.from(buttons).find(
			btn => btn.textContent?.trim() === "New project"
		);

		if (target instanceof HTMLElement) {
			target.click();
			console.log("✅ 'New project' button clicked!");

			// Wait for the form inputs before filling
			waitForElement('[data-testid="name-form-input"]')
				.then(() => {
					fillAndSubmitProjectForm("My-Test-Project_123", "This is a project created by script.");
				})
				.catch(err => console.error(err));
		} else {
			console.error("❌ 'New project' button not found");
		}
	}

	onMount(async () => {
		if (!rootContainer) return;

		try {
			// Load the React remote
			const remote = await import('mlrun/svelte');
			remoteApp = remote;

			if (remoteApp?.mount) {
				await remoteApp.mount(rootContainer);
				mounted = true;

				// 🔍 Log what's inside after React renders
				setTimeout(() => {
					console.log('[Svelte Sidebar] React content mounted in rootContainer:', rootContainer?.innerHTML);
					setTimeout(clickNewProjectButton, 1000);
				}, 100);
			} else {
				console.error('Remote does not export mount()');
			}
		} catch (err) {
			console.error('Failed to load React remote:', err);
		}
	});

	onDestroy(() => {
		if (remoteApp?.unmount) {
			remoteApp.unmount();
			mounted = false;
			console.log('[Svelte Sidebar] React content unmounted from rootContainer');
		}
	});

	const showFullScreen = () => {
		if (rootContainer?.requestFullscreen) rootContainer.requestFullscreen();
		else if ((rootContainer as any)?.webkitRequestFullscreen) (rootContainer as any).webkitRequestFullscreen();
		else if ((rootContainer as any)?.msRequestFullscreen) (rootContainer as any).msRequestFullscreen();
	};

	const closeHandler = () => {
		showControls.set(false);
		showMlrun.set(false);
		dispatch('close');
	};
</script>


<div class="w-full h-full relative flex flex-col bg-gray-50 dark:bg-gray-850">
	<!-- Top controls -->
	<div class="pointer-events-auto z-20 flex justify-between items-center p-2.5 font-primar text-gray-900 dark:text-white">
		<Tooltip content={$i18n.t('Close MLRun')}>
			<button
				class="self-center pointer-events-auto p-1 rounded-full bg-white dark:bg-gray-850"
				on:click={closeHandler}
			>
				<XMark className="size-5 text-gray-900 dark:text-white" />
			</button>
		</Tooltip>

		<div class="flex items-center gap-1.5">
			<Tooltip content={$i18n.t('Open in full screen')}>
				<button
					class="bg-none border-none text-xs bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 transition rounded-md p-0.5"
					on:click={showFullScreen}
				>
					<ArrowsPointingOut className="size-3.5" />
				</button>
			</Tooltip>
		</div>
	</div>

	{#if overlay}
		<div class="absolute top-0 left-0 right-0 bottom-0 z-10"></div>
	{/if}

	<!-- React remote container -->
	<div id="overlay_container"></div>
	<div class="flex-1 w-full h-full flex justify-center items-center">
		<div
			id="root"
			bind:this={rootContainer}
			class="remote-slot"
		>
			{#if !mounted}
				<div class="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
					{$i18n.t('Loading remote content...')}
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
    .remote-slot {
        height: 100%;
        width: 100%;
    }
</style>
