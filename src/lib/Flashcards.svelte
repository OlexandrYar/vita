<script>
	import { plantsStore } from './plants.svelte.js';

	let started = $state(false);
	let finished = $state(false);
	let count = $state(1);
	/** @type {import('./plants.svelte.js').Plant[]} */
	let deck = $state([]);
	let currentIndex = $state(0);
	let flipped = $state(false);

	$effect(() => {
		const len = plantsStore.list.length;
		if (!started) {
			count = len;
		}
	});

	/** @param {import('./plants.svelte.js').Plant[]} arr */
	function shuffle(arr) {
		const a = [...arr];
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}

	function start() {
		deck = shuffle(plantsStore.list).slice(0, count);
		currentIndex = 0;
		flipped = false;
		started = true;
		finished = false;
	}

	function next() {
		if (currentIndex < deck.length - 1) {
			currentIndex++;
			flipped = false;
		} else {
			finished = true;
		}
	}

	function prev() {
		if (currentIndex > 0) {
			currentIndex--;
			flipped = false;
		}
	}

	function reset() {
		started = false;
		finished = false;
		deck = [];
		currentIndex = 0;
		flipped = false;
	}

	let current = $derived(deck[currentIndex]);
	let maxCount = $derived(plantsStore.list.length);

	/** @param {number} n */
	function pluralRoslyn(n) {
		if (n === 1) return '1 рослину';
		if (n >= 2 && n <= 4) return `${n} рослини`;
		return `${n} рослин`;
	}
</script>

<div class="fc-page">
	{#if maxCount === 0}
		<div class="empty">
			<div class="empty-icon">❧</div>
			<p class="empty-title">Немає рослин для карток</p>
			<p class="empty-sub">Спочатку додайте рослини до гербарію</p>
		</div>
	{:else if !started}
		<!-- Setup screen -->
		<div class="setup">
			<div class="section-title">
				<h2>Картки для вивчення</h2>
				<div class="ornament">— ✦ —</div>
			</div>

			<div class="setup-card">
				<p class="setup-desc">Оберіть кількість карток для сесії</p>

				<div class="count-display">
					<span class="count-num">{count}</span>
					{#if count === maxCount}
						<span class="count-all">всі рослини</span>
					{:else}
						<span class="count-all">{count === 1 ? 'рослина' : count <= 4 ? 'рослини' : 'рослин'}</span>
					{/if}
				</div>

				<div class="slider-wrap">
					<span class="edge">1</span>
					<input
						type="range"
						min="1"
						max={maxCount}
						bind:value={count}
						class="slider"
					/>
					<span class="edge">{maxCount}</span>
				</div>

				<div class="presets">
					{#each [5, 10, 20] as n}
						{#if maxCount >= n}
							<button class="preset" onclick={() => (count = n)}>{n}</button>
						{/if}
					{/each}
					<button class="preset all-preset" onclick={() => (count = maxCount)}>Всі</button>
				</div>

				<button onclick={start} class="btn-start">Перемішати та почати</button>
			</div>
		</div>
	{:else if finished}
		<!-- Finished -->
		<div class="setup">
			<div class="section-title">
				<h2>Молодець!</h2>
				<div class="ornament">— ✦ —</div>
			</div>
			<div class="setup-card" style="text-align: center;">
				<div class="fin-icon">✦</div>
				<p class="fin-text">Ви переглянули {pluralRoslyn(deck.length)}</p>
				<div class="fin-actions">
					<button onclick={start} class="btn-start" style="margin-bottom: 0.75rem">
						Почати знову
					</button>
					<button onclick={reset} class="btn-back"> До налаштувань </button>
				</div>
			</div>
		</div>
	{:else}
		<!-- Study -->
		<div class="study">
			<div class="progress-row">
				<div class="progress-bar">
					<div class="progress-fill" style="width: {((currentIndex + 1) / deck.length) * 100}%"></div>
				</div>
				<span class="progress-label">{currentIndex + 1} / {deck.length}</span>
			</div>

			<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
			<div class="card-scene" onclick={() => (flipped = !flipped)}>
				<div class="flashcard" class:flipped>
					<div class="card-face card-front">
						<img src={current.imageUrl} alt="Рослина" />
						<div class="front-hint">Натисніть, щоб побачити назву</div>
					</div>
					<div class="card-face card-back">
						<div class="back-deco">❧</div>
						<h3 class="back-name">{current.name}</h3>
						{#if current.latinName}
							<p class="back-latin">{current.latinName}</p>
						{/if}
						<p class="back-sub">Назва рослини</p>
					</div>
				</div>
			</div>

			<div class="controls">
				<button class="btn-nav" onclick={prev} disabled={currentIndex === 0}>← Назад</button>
				<button class="btn-flip" onclick={() => (flipped = !flipped)}>Перевернути</button>
				<button class="btn-nav" onclick={next}>
					{currentIndex === deck.length - 1 ? 'Завершити ✓' : 'Далі →'}
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.fc-page {
		max-width: 680px;
		margin: 0 auto;
	}

	/* Empty */
	.empty {
		text-align: center;
		padding: 5rem 2rem;
		color: var(--text-muted);
	}

	.empty-icon {
		font-size: 4rem;
		color: var(--border);
		margin-bottom: 1rem;
		opacity: 0.7;
	}

	.empty-title {
		font-size: 1.25rem;
		font-family: 'Playfair Display', serif;
		color: var(--text);
		margin-bottom: 0.5rem;
	}

	.empty-sub {
		font-size: 0.9rem;
	}

	/* Section title */
	.section-title {
		text-align: center;
		margin-bottom: 2rem;
	}

	.section-title h2 {
		font-size: 1.75rem;
		color: var(--text);
		margin-bottom: 0.4rem;
	}

	.ornament {
		color: var(--accent-brown);
		letter-spacing: 0.3em;
		font-size: 0.9rem;
	}

	/* Setup */
	.setup {
		padding: 0.5rem 0;
	}

	.setup-card {
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 4px 20px var(--shadow);
	}

	.setup-desc {
		text-align: center;
		color: var(--text-muted);
		font-size: 0.95rem;
		margin-bottom: 1.75rem;
	}

	.count-display {
		text-align: center;
		margin-bottom: 1.25rem;
		line-height: 1;
	}

	.count-num {
		display: block;
		font-size: 4rem;
		font-family: 'Playfair Display', serif;
		font-weight: 700;
		color: var(--header);
	}

	.count-all {
		display: block;
		font-size: 0.85rem;
		color: var(--text-muted);
		margin-top: 0.2rem;
		font-style: italic;
	}

	.slider-wrap {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.edge {
		font-size: 0.8rem;
		color: var(--text-muted);
		min-width: 1.25rem;
		text-align: center;
	}

	.slider {
		flex: 1;
		accent-color: var(--accent-green);
		height: 5px;
		cursor: pointer;
	}

	.presets {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
		margin-bottom: 2rem;
		flex-wrap: wrap;
	}

	.preset {
		padding: 0.35rem 1rem;
		border: 1px solid var(--border);
		border-radius: 20px;
		background: none;
		color: var(--text-muted);
		font-size: 0.85rem;
		transition: all 0.15s;
	}

	.preset:hover,
	.all-preset {
		background: var(--header);
		color: #f0e8d0;
		border-color: var(--header);
	}

	.btn-start {
		display: block;
		width: 100%;
		padding: 0.875rem;
		background: var(--header);
		color: #f0e8d0;
		border: none;
		border-radius: 6px;
		font-size: 1rem;
		letter-spacing: 0.05em;
		transition: background-color 0.2s;
	}

	.btn-start:hover {
		background: #3d6b3d;
	}

	.btn-back {
		display: block;
		width: 100%;
		padding: 0.75rem;
		background: none;
		border: 1px solid var(--border);
		border-radius: 6px;
		color: var(--text-muted);
		font-size: 0.9rem;
		transition: background-color 0.15s;
	}

	.btn-back:hover {
		background: #f0e8d0;
	}

	/* Finished */
	.fin-icon {
		font-size: 3rem;
		color: var(--accent-brown);
		margin-bottom: 1rem;
	}

	.fin-text {
		color: var(--text-muted);
		font-size: 1rem;
		margin-bottom: 2rem;
	}

	.fin-actions {
		display: flex;
		flex-direction: column;
		gap: 0;
		max-width: 280px;
		margin: 0 auto;
	}

	/* Study */
	.study {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.progress-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.progress-bar {
		flex: 1;
		height: 5px;
		background: var(--border);
		border-radius: 3px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: var(--accent-green);
		transition: width 0.3s ease;
		border-radius: 3px;
	}

	.progress-label {
		font-size: 0.8rem;
		color: var(--text-muted);
		white-space: nowrap;
	}

	.card-scene {
		perspective: 1200px;
		height: 420px;
		cursor: pointer;
		user-select: none;
	}

	.flashcard {
		width: 100%;
		height: 100%;
		position: relative;
		transform-style: preserve-3d;
		transition: transform 0.55s cubic-bezier(0.4, 0, 0.2, 1);
		border-radius: 12px;
	}

	.flashcard.flipped {
		transform: rotateY(180deg);
	}

	.card-face {
		position: absolute;
		inset: 0;
		backface-visibility: hidden;
		border-radius: 12px;
		border: 1px solid var(--border);
		overflow: hidden;
		box-shadow: 0 8px 30px var(--shadow);
	}

	.card-front {
		background: #111;
	}

	.card-front img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		opacity: 0.92;
	}

	.front-hint {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 1.5rem 1rem 0.875rem;
		background: linear-gradient(transparent, rgba(0, 0, 0, 0.55));
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.8rem;
		text-align: center;
		font-family: 'Lora', serif;
		font-style: italic;
		letter-spacing: 0.02em;
	}

	.card-back {
		transform: rotateY(180deg);
		background: var(--card);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2.5rem;
		background-image:
			linear-gradient(rgba(200, 185, 154, 0.09) 1px, transparent 1px),
			linear-gradient(90deg, rgba(200, 185, 154, 0.09) 1px, transparent 1px);
		background-size: 28px 28px;
	}

	.back-deco {
		font-size: 2.5rem;
		color: var(--accent-brown);
		margin-bottom: 1.5rem;
		opacity: 0.5;
	}

	.back-name {
		font-size: clamp(1.5rem, 4vw, 2.25rem);
		font-style: italic;
		color: var(--text);
		text-align: center;
		margin-bottom: 0.875rem;
		line-height: 1.35;
	}

	.back-latin {
		font-style: italic;
		font-size: 1rem;
		color: var(--text-muted);
		margin-bottom: 0.75rem;
		text-align: center;
	}

	.back-sub {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.25em;
		color: var(--text-muted);
	}

	/* Controls */
	.controls {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
		align-items: center;
		flex-wrap: wrap;
	}

	.btn-nav {
		padding: 0.7rem 1.375rem;
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 6px;
		color: var(--text);
		font-size: 0.9rem;
		transition: all 0.15s;
		flex: 1;
		max-width: 160px;
	}

	.btn-nav:hover:not(:disabled) {
		background: #ede6d8;
		border-color: var(--accent-green);
	}

	.btn-nav:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.btn-flip {
		padding: 0.7rem 1.75rem;
		background: var(--header);
		border: none;
		border-radius: 6px;
		color: #f0e8d0;
		font-size: 0.9rem;
		transition: background-color 0.15s;
		flex: 1;
		max-width: 180px;
	}

	.btn-flip:hover {
		background: #3d6b3d;
	}
</style>
