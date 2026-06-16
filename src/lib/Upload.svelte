<script>
	import { plantsStore } from './plants.svelte.js';

	let name = $state('');
	let latinName = $state('');
	/** @type {File | null} */
	let selectedFile = $state(null);
	/** @type {string | null} */
	let previewUrl = $state(null);
	let dragging = $state(false);
	let saving = $state(false);
	let success = $state(false);
	let error = $state('');
	/** @type {HTMLInputElement | null} */
	let fileInput = $state(null);

	/** @param {File | null | undefined} file */
	function handleFile(file) {
		if (!file) return;
		if (!file.type.startsWith('image/')) {
			error = 'Будь ласка, оберіть файл зображення';
			return;
		}
		error = '';
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		selectedFile = file;
		previewUrl = URL.createObjectURL(file);
	}

	/** @param {DragEvent} e */
	function handleDrop(e) {
		e.preventDefault();
		dragging = false;
		handleFile(e.dataTransfer?.files[0]);
	}

	/** @param {DragEvent} e */
	function handleDragover(e) {
		e.preventDefault();
		dragging = true;
	}

	/** @param {Event} e */
	function handleFileInput(e) {
		const input = /** @type {HTMLInputElement} */ (e.target);
		handleFile(input.files?.[0]);
	}

	async function save() {
		error = '';
		if (!name.trim()) { error = 'Введіть назву рослини'; return; }
		if (!selectedFile) { error = 'Оберіть фото рослини'; return; }

		saving = true;
		try {
			await plantsStore.add(name.trim(), latinName.trim(), selectedFile);
			name = '';
			latinName = '';
			if (previewUrl) URL.revokeObjectURL(previewUrl);
			previewUrl = null;
			selectedFile = null;
			if (fileInput) fileInput.value = '';
			success = true;
			setTimeout(() => (success = false), 3000);
		} catch (/** @type {any} */ err) {
			error = err.message ?? 'Помилка збереження';
		} finally {
			saving = false;
		}
	}
</script>

<div class="upload-page">
	<div class="section-title">
		<h2>Додати рослину</h2>
		<div class="ornament">— ✦ —</div>
	</div>

	<div class="form-card">
		<!-- svelte-ignore a11y_interactive_supports_focus -->
		<div
			class="drop-zone"
			class:dragging
			ondrop={handleDrop}
			ondragover={handleDragover}
			ondragleave={() => (dragging = false)}
			onclick={() => fileInput?.click()}
			role="button"
			onkeydown={(e) => e.key === 'Enter' && fileInput?.click()}
			tabindex="0"
		>
			{#if previewUrl}
				<img src={previewUrl} alt="Прев'ю рослини" class="preview-img" />
				<div class="change-overlay">Змінити фото</div>
			{:else}
				<div class="drop-content">
					<div class="drop-icon">❧</div>
					<p class="drop-text">Перетягніть фото сюди</p>
					<p class="drop-sub">або натисніть для вибору</p>
				</div>
			{/if}
		</div>

		<input
			bind:this={fileInput}
			type="file"
			accept="image/*"
			onchange={handleFileInput}
			style="display: none"
		/>

		<div class="field">
			<label for="plant-name" class="label">Назва українською</label>
			<input
				id="plant-name"
				type="text"
				bind:value={name}
				placeholder="Наприклад: Ромашка лікарська"
				class="input"
				onkeydown={(e) => e.key === 'Enter' && save()}
			/>
		</div>

		<div class="field">
			<label for="plant-latin" class="label">
				Назва латинською <span class="optional">(необов'язково)</span>
			</label>
			<input
				id="plant-latin"
				type="text"
				bind:value={latinName}
				placeholder="Наприклад: Matricaria chamomilla"
				class="input latin-input"
				onkeydown={(e) => e.key === 'Enter' && save()}
			/>
		</div>

		{#if error}
			<p class="error-msg">{error}</p>
		{/if}

		{#if success}
			<div class="success-msg">✓ &nbsp; Рослину успішно додано до гербарію!</div>
		{/if}

		<button onclick={save} class="btn-save" disabled={saving}>
			{saving ? 'Збереження…' : 'Зберегти в гербарій'}
		</button>
	</div>
</div>

<style>
	.upload-page {
		max-width: 560px;
		margin: 0 auto;
	}

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

	.form-card {
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 4px 20px var(--shadow);
	}

	.drop-zone {
		border: 2px dashed var(--border);
		border-radius: 8px;
		height: 260px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition:
			border-color 0.2s,
			background-color 0.2s;
		position: relative;
		overflow: hidden;
		margin-bottom: 1.5rem;
		background-color: #faf7f0;
		user-select: none;
	}

	.drop-zone:hover,
	.drop-zone.dragging {
		border-color: var(--accent-green);
		background-color: #eff5ef;
	}

	.drop-content {
		text-align: center;
		pointer-events: none;
	}

	.drop-icon {
		font-size: 3.5rem;
		color: var(--accent-brown);
		margin-bottom: 0.75rem;
		line-height: 1;
		opacity: 0.7;
	}

	.drop-text {
		font-size: 1rem;
		color: var(--text);
		margin-bottom: 0.3rem;
	}

	.drop-sub {
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.preview-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.change-overlay {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.35);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: 'Lora', serif;
		font-size: 1rem;
		opacity: 0;
		transition: opacity 0.2s;
	}

	.drop-zone:hover .change-overlay {
		opacity: 1;
	}

	.field {
		margin-bottom: 1.25rem;
	}

	.label {
		display: block;
		font-size: 0.8rem;
		color: var(--text-muted);
		margin-bottom: 0.4rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.optional {
		font-size: 0.75rem;
		text-transform: none;
		letter-spacing: 0;
		color: var(--border);
		font-style: italic;
	}

	.latin-input::placeholder {
		font-style: italic;
	}

	.input {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: white;
		font-family: 'Lora', serif;
		font-size: 1rem;
		color: var(--text);
		transition:
			border-color 0.2s,
			box-shadow 0.2s;
	}

	.input:focus {
		outline: none;
		border-color: var(--accent-green);
		box-shadow: 0 0 0 3px rgba(74, 122, 74, 0.12);
	}

	.input::placeholder {
		color: #b8a890;
		font-style: italic;
	}

	.error-msg {
		color: #b03a2e;
		font-size: 0.875rem;
		margin-bottom: 1rem;
		padding: 0.5rem 0.75rem;
		background: #fdecea;
		border-radius: 4px;
		border-left: 3px solid #b03a2e;
	}

	.success-msg {
		background: #edf7ed;
		color: #2e7d32;
		padding: 0.75rem 1rem;
		border-radius: 6px;
		font-size: 0.9rem;
		margin-bottom: 1rem;
		border: 1px solid #a5d6a7;
	}

	.btn-save {
		width: 100%;
		padding: 0.875rem;
		background: var(--header);
		color: #f0e8d0;
		border: none;
		border-radius: 6px;
		font-family: 'Lora', serif;
		font-size: 1rem;
		letter-spacing: 0.06em;
		transition: background-color 0.2s;
	}

	.btn-save:hover:not(:disabled) {
		background: #3d6b3d;
	}

	.btn-save:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
