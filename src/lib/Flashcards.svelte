<script>
	import { plantsStore } from './plants.svelte.js';
	import { speak } from './speech.js';
	import { SvelteSet } from 'svelte/reactivity';

	/** @typedef {import('./plants.svelte.js').Plant} Plant */

	let started = $state(false);
	let finished = $state(false);
	/** @type {Plant[]} */
	let deck = $state([]);
	let currentIndex = $state(0);
	let flipped = $state(false);

	/** @type {'number' | 'name'} */
	let sortMode = $state('number');
	let doShuffle = $state(true);
	/** Selected plant ids. @type {SvelteSet<number>} */
	const selected = new SvelteSet();
	let initialized = false;

	/** Витягує номер з початку української назви, напр. "31 Орхідея" → 31. @param {string} name */
	function plantNumber(name) {
		const m = name.match(/^\s*(\d+)/);
		return m ? parseInt(m[1], 10) : null;
	}

	/** Назва без числового префікса для сортування за алфавітом. @param {string} name */
	function stripNumber(name) {
		return name.replace(/^\s*\d+\s*/, '').trim() || name;
	}

	let sortedList = $derived.by(() => {
		const arr = [...plantsStore.list];
		if (sortMode === 'number') {
			arr.sort((a, b) => {
				const na = plantNumber(a.name);
				const nb = plantNumber(b.name);
				if (na === null && nb === null) return a.name.localeCompare(b.name, 'uk');
				if (na === null) return 1;
				if (nb === null) return -1;
				return na - nb;
			});
		} else {
			arr.sort((a, b) => stripNumber(a.name).localeCompare(stripNumber(b.name), 'uk'));
		}
		return arr;
	});

	let selectedCount = $derived(sortedList.filter((p) => selected.has(p.id)).length);
	let allSelected = $derived(sortedList.length > 0 && selectedCount === sortedList.length);

	// За замовчуванням позначаємо всі рослини, коли список завантажився.
	$effect(() => {
		const ids = plantsStore.list.map((p) => p.id);
		if (!started && !initialized && ids.length) {
			for (const id of ids) selected.add(id);
			initialized = true;
		}
	});

	/** @param {number} id */
	function toggle(id) {
		if (selected.has(id)) selected.delete(id);
		else selected.add(id);
	}

	function selectAll() {
		for (const p of sortedList) selected.add(p.id);
	}

	function clearAll() {
		selected.clear();
	}

	/** @param {Plant[]} arr */
	function shuffle(arr) {
		const a = [...arr];
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}

	function start() {
		const chosen = sortedList.filter((p) => selected.has(p.id));
		if (chosen.length === 0) return;
		deck = doShuffle ? shuffle(chosen) : chosen;
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

	/** @param {string} name */
	function displayNumber(name) {
		const n = plantNumber(name);
		return n === null ? '·' : n;
	}

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
				<p class="setup-desc">Оберіть рослини та порядок для сесії</p>

				<!-- Сортування -->
				<div class="sort-row">
					<span class="sort-label">Сортувати</span>
					<div class="segmented">
						<button
							class="seg"
							class:active={sortMode === 'number'}
							onclick={() => (sortMode = 'number')}
						>За номером</button>
						<button
							class="seg"
							class:active={sortMode === 'name'}
							onclick={() => (sortMode = 'name')}
						>За назвою</button>
					</div>
				</div>

				<!-- Панель вибору -->
				<div class="select-bar">
					<span class="select-count">Вибрано {selectedCount} з {maxCount}</span>
					<button class="link-btn" onclick={allSelected ? clearAll : selectAll}>
						{allSelected ? 'Зняти всі' : 'Вибрати всі'}
					</button>
				</div>

				<!-- Список рослин -->
				<ul class="plant-list">
					{#each sortedList as plant (plant.id)}
						<li>
							<label class="plant-row" class:checked={selected.has(plant.id)}>
								<input
									type="checkbox"
									checked={selected.has(plant.id)}
									onchange={() => toggle(plant.id)}
								/>
								<span class="row-check" aria-hidden="true"></span>
								<span class="row-num">{displayNumber(plant.name)}</span>
								<img class="row-thumb" src={plant.imageUrl} alt="" />
								<span class="row-name">
									{plant.name}
									{#if plant.latinName}<em class="row-latin">{plant.latinName}</em>{/if}
								</span>
							</label>
						</li>
					{/each}
				</ul>

				<!-- Перемішати -->
				<label class="shuffle-row">
					<input type="checkbox" bind:checked={doShuffle} />
					<span class="row-check" aria-hidden="true"></span>
					<span>Перемішати картки</span>
				</label>

				<button onclick={start} class="btn-start" disabled={selectedCount === 0}>
					{doShuffle ? 'Перемішати та почати' : 'Почати'}
				</button>
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
							<div class="back-latin-row">
								<p class="back-latin">{current.latinName}</p>
								<button
									class="btn-speak"
									onclick={(e) => { e.stopPropagation(); speak(current.latinName ?? ''); }}
									title="Вимовити"
									aria-label="Вимовити латинську назву"
								>🔊</button>
							</div>
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

	/* Сортування */
	.sort-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 1.25rem;
		flex-wrap: wrap;
	}

	.sort-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
	}

	.segmented {
		display: flex;
		border: 1px solid var(--border);
		border-radius: 20px;
		overflow: hidden;
	}

	.seg {
		padding: 0.4rem 1rem;
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: 0.85rem;
		cursor: pointer;
		transition: all 0.15s;
	}

	.seg.active {
		background: var(--header);
		color: #f0e8d0;
	}

	/* Панель вибору */
	.select-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.select-count {
		font-size: 0.85rem;
		color: var(--text-muted);
		font-style: italic;
	}

	.link-btn {
		background: none;
		border: none;
		color: var(--accent-green);
		font-size: 0.85rem;
		cursor: pointer;
		padding: 0.2rem 0.3rem;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.link-btn:hover {
		color: var(--header);
	}

	/* Список рослин */
	.plant-list {
		list-style: none;
		margin: 0 0 1.25rem;
		padding: 0.3rem;
		max-height: 340px;
		overflow-y: auto;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.4);
	}

	.plant-row {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		padding: 0.45rem 0.55rem;
		border-radius: 6px;
		cursor: pointer;
		transition: background-color 0.15s;
	}

	.plant-row:hover {
		background: #f0e8d0;
	}

	.plant-row.checked {
		background: rgba(74, 122, 74, 0.1);
	}

	.plant-row input,
	.shuffle-row input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.row-check {
		flex-shrink: 0;
		width: 18px;
		height: 18px;
		border: 1.5px solid var(--border);
		border-radius: 4px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: white;
		transition: all 0.15s;
	}

	.plant-row.checked .row-check,
	.shuffle-row input:checked + .row-check {
		background: var(--accent-green);
		border-color: var(--accent-green);
	}

	.plant-row.checked .row-check::after,
	.shuffle-row input:checked + .row-check::after {
		content: '✓';
		color: white;
		font-size: 0.75rem;
		line-height: 1;
	}

	.row-num {
		flex-shrink: 0;
		min-width: 1.75rem;
		text-align: center;
		font-family: 'Playfair Display', serif;
		font-weight: 700;
		font-size: 0.9rem;
		color: var(--accent-brown);
	}

	.row-thumb {
		flex-shrink: 0;
		width: 38px;
		height: 38px;
		object-fit: cover;
		border-radius: 4px;
		border: 1px solid var(--border);
	}

	.row-name {
		font-family: 'Lora', serif;
		font-size: 0.9rem;
		color: var(--text);
		line-height: 1.3;
		display: flex;
		flex-direction: column;
	}

	.row-latin {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	/* Перемішати */
	.shuffle-row {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		margin-bottom: 1.5rem;
		cursor: pointer;
		font-size: 0.9rem;
		color: var(--text);
		position: relative;
	}

	.btn-start:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.btn-start:disabled:hover {
		background: var(--header);
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

	.back-latin-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.back-latin {
		font-style: italic;
		font-size: 1rem;
		color: var(--text-muted);
		text-align: center;
		margin: 0;
	}

	.btn-speak {
		flex-shrink: 0;
		background: none;
		border: 1px solid var(--border);
		border-radius: 50%;
		width: 30px;
		height: 30px;
		font-size: 0.8rem;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: var(--text-muted);
		transition: background-color 0.15s, border-color 0.15s;
		line-height: 1;
	}

	.btn-speak:hover {
		background: #f0e8d0;
		border-color: var(--accent-brown);
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
