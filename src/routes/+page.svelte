<script>
	import { fade } from 'svelte/transition';
	import Upload from '$lib/Upload.svelte';
	import Gallery from '$lib/Gallery.svelte';
	import Flashcards from '$lib/Flashcards.svelte';
	import { plantsStore } from '$lib/plants.svelte.js';

	let view = $state('gallery');

	const tabs = [
		{ id: 'upload', label: 'Додати рослину', icon: '✚' },
		{ id: 'gallery', label: 'Галерея', icon: '❀' },
		{ id: 'flashcards', label: 'Картки', icon: '✦' }
	];

	$effect(() => {
		plantsStore.load();
	});
</script>

<div class="app">
	<header class="header">
		<div class="deco">✦ &nbsp; ❧ &nbsp; ✦</div>
		<h1 class="title">Vita Gerbarium</h1>
		<p class="subtitle">Гербарій рослин</p>
		<div class="deco">✦ &nbsp; ❧ &nbsp; ✦</div>

		<form method="POST" action="/logout" class="logout-form">
			<button type="submit" class="btn-logout" title="Вийти">Вийти</button>
		</form>
	</header>

	<nav class="nav">
		{#each tabs as tab}
			<button class="nav-btn" class:active={view === tab.id} onclick={() => (view = tab.id)}>
				<span class="nav-icon">{tab.icon}</span>
				<span class="nav-label">{tab.label}</span>
			</button>
		{/each}
	</nav>

	<main class="main">
		{#if plantsStore.loading}
			<div class="loading">
				<div class="loading-icon">❧</div>
				<p>Завантаження гербарію…</p>
			</div>
		{:else}
			{#key view}
				<div in:fade={{ duration: 180 }}>
					{#if view === 'upload'}
						<Upload />
					{:else if view === 'gallery'}
						<Gallery />
					{:else if view === 'flashcards'}
						<Flashcards />
					{/if}
				</div>
			{/key}
		{/if}
	</main>

	<footer class="footer">
		<span>✦ &nbsp; Vita Gerbarium &nbsp; ✦</span>
	</footer>
</div>

<style>
	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.header {
		background-color: var(--header);
		color: #f0e8d0;
		text-align: center;
		padding: 2rem 1rem 1.5rem;
		border-bottom: 3px solid var(--accent-brown);
		position: relative;
	}

	.deco {
		font-size: 0.85rem;
		color: #c8aa78;
		letter-spacing: 0.4em;
		margin: 0.4rem 0;
	}

	.title {
		font-size: clamp(1.75rem, 5vw, 2.75rem);
		font-weight: 700;
		font-style: italic;
		color: #f0e8d0;
		letter-spacing: 0.04em;
		margin: 0.2rem 0;
	}

	.subtitle {
		font-size: 0.75rem;
		color: #a8c4a0;
		letter-spacing: 0.35em;
		text-transform: uppercase;
		font-family: 'Lora', serif;
		margin-top: 0.15rem;
	}

	.logout-form {
		position: absolute;
		top: 1rem;
		right: 1rem;
	}

	.btn-logout {
		background: none;
		border: 1px solid rgba(240, 232, 208, 0.3);
		color: rgba(240, 232, 208, 0.7);
		font-family: 'Lora', serif;
		font-size: 0.75rem;
		padding: 0.35rem 0.75rem;
		border-radius: 4px;
		letter-spacing: 0.05em;
		transition:
			color 0.2s,
			border-color 0.2s;
	}

	.btn-logout:hover {
		color: #f0e8d0;
		border-color: rgba(240, 232, 208, 0.6);
	}

	.nav {
		display: flex;
		background-color: var(--nav);
		border-bottom: 2px solid var(--accent-brown);
	}

	.nav-btn {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
		padding: 0.75rem 0.5rem;
		border: none;
		background: none;
		color: #b8d4b8;
		font-family: 'Lora', serif;
		transition:
			background-color 0.2s,
			color 0.2s;
		border-right: 1px solid rgba(255, 255, 255, 0.08);
	}

	.nav-btn:last-child {
		border-right: none;
	}

	.nav-btn:hover {
		background-color: rgba(255, 255, 255, 0.08);
		color: #f0e8d0;
	}

	.nav-btn.active {
		background-color: var(--bg);
		color: var(--text);
	}

	.nav-icon {
		font-size: 1rem;
	}

	.nav-label {
		font-size: 0.8rem;
	}

	@media (min-width: 480px) {
		.nav-btn {
			flex-direction: row;
			gap: 0.5rem;
			padding: 0.875rem 1rem;
		}

		.nav-label {
			font-size: 0.95rem;
		}
	}

	.main {
		flex: 1;
		padding: 2rem 1rem;
		max-width: 1200px;
		width: 100%;
		margin: 0 auto;
	}

	.loading {
		text-align: center;
		padding: 5rem 2rem;
		color: var(--text-muted);
	}

	.loading-icon {
		font-size: 3rem;
		color: var(--border);
		margin-bottom: 1rem;
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 0.4; }
		50% { opacity: 1; }
	}

	.footer {
		text-align: center;
		padding: 1rem;
		color: var(--text-muted);
		font-size: 0.75rem;
		border-top: 1px solid var(--border);
		letter-spacing: 0.25em;
	}
</style>
