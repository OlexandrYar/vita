<script>
	import { plantsStore } from './plants.svelte.js';

	/** @typedef {import('./plants.svelte.js').Plant} Plant */

	// ── Delete ──────────────────────────────────────────────────────────────
	/** @type {number | null} */
	let confirmId = $state(null);
	let deleting = $state(false);

	/** @param {number} id */
	async function remove(id) {
		deleting = true;
		try {
			await plantsStore.remove(id);
		} finally {
			deleting = false;
			confirmId = null;
		}
	}

	// ── Edit ────────────────────────────────────────────────────────────────
	/** @type {Plant | null} */
	let editPlant = $state(null);
	let editName = $state('');
	let editLatinName = $state('');
	/** @type {File | null} */
	let editFile = $state(null);
	/** @type {string | null} */
	let editPreviewUrl = $state(null);
	let editSaving = $state(false);
	let editError = $state('');
	/** @type {HTMLInputElement | null} */
	let editFileInput = $state(null);

	/** @param {Plant} plant */
	function openEdit(plant) {
		editPlant = plant;
		editName = plant.name;
		editLatinName = plant.latinName ?? '';
		editFile = null;
		editPreviewUrl = null;
		editError = '';
	}

	function closeEdit() {
		if (editPreviewUrl) URL.revokeObjectURL(editPreviewUrl);
		editPlant = null;
		editPreviewUrl = null;
		editFile = null;
		editError = '';
	}

	/** @param {File | null | undefined} file */
	function handleEditFile(file) {
		if (!file) return;
		if (!file.type.startsWith('image/')) {
			editError = 'Будь ласка, оберіть файл зображення';
			return;
		}
		editError = '';
		if (editPreviewUrl) URL.revokeObjectURL(editPreviewUrl);
		editFile = file;
		editPreviewUrl = URL.createObjectURL(file);
	}

	/** @param {Event} e */
	function handleEditFileInput(e) {
		const input = /** @type {HTMLInputElement} */ (e.target);
		handleEditFile(input.files?.[0]);
	}

	async function saveEdit() {
		if (!editPlant) return;
		editError = '';
		if (!editName.trim()) {
			editError = 'Введіть назву рослини';
			return;
		}
		editSaving = true;
		try {
			await plantsStore.update(editPlant.id, editName.trim(), editLatinName.trim(), editFile);
			closeEdit();
		} catch (/** @type {any} */ err) {
			editError = err.message ?? 'Помилка збереження';
		} finally {
			editSaving = false;
		}
	}

	// ── Helpers ─────────────────────────────────────────────────────────────
	/** @param {number} id */
	function tilt(id) {
		return ((id % 9) - 4) * 0.35;
	}

	/** @param {number} n */
	function pluralRoslyn(n) {
		if (n === 1) return '1 рослина';
		if (n >= 2 && n <= 4) return `${n} рослини`;
		return `${n} рослин`;
	}
</script>

<div class="gallery-page">
	<div class="section-title">
		<h2>Галерея рослин</h2>
		<div class="ornament">— ✦ —</div>
		{#if plantsStore.list.length > 0}
			<p class="count">{pluralRoslyn(plantsStore.list.length)} у гербарії</p>
		{/if}
	</div>

	{#if plantsStore.list.length === 0}
		<div class="empty">
			<div class="empty-icon">❧</div>
			<p class="empty-title">Гербарій порожній</p>
			<p class="empty-sub">Додайте першу рослину, щоб почати збирати колекцію</p>
		</div>
	{:else}
		<div class="grid">
			{#each plantsStore.list as plant (plant.id)}
				<div class="plant-card" style="--rot: {tilt(plant.id)}deg">
					<div class="card-img-wrap">
						<img src={plant.imageUrl} alt={plant.name} class="card-img" />
					</div>
					<div class="card-label">
						<div class="label-rule"></div>
						<p class="plant-name">{plant.name}</p>
						{#if plant.latinName}
							<p class="latin-name">{plant.latinName}</p>
						{/if}
					</div>

					<button
						class="card-btn edit-btn"
						onclick={() => openEdit(plant)}
						title="Редагувати"
						aria-label="Редагувати {plant.name}"
					>✎</button>

					<button
						class="card-btn delete-btn"
						onclick={() => (confirmId = plant.id)}
						title="Видалити"
						aria-label="Видалити {plant.name}"
					>✕</button>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- ── Delete confirm modal ─────────────────────────────────────────────── -->
{#if confirmId !== null}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={() => (confirmId = null)}>
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div class="modal modal-sm" onclick={(e) => e.stopPropagation()}>
			<div class="modal-icon">❧</div>
			<h3>Видалити рослину?</h3>
			<p>Цю дію неможливо скасувати.</p>
			<div class="modal-actions">
				<button class="btn-cancel" onclick={() => (confirmId = null)}>Скасувати</button>
				<button
					class="btn-danger"
					disabled={deleting}
					onclick={() => confirmId !== null && remove(confirmId)}
				>
					{deleting ? 'Видалення…' : 'Видалити'}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- ── Edit modal ───────────────────────────────────────────────────────── -->
{#if editPlant !== null}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={closeEdit}>
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div class="modal modal-edit" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h3>Редагувати рослину</h3>
				<div class="modal-ornament">— ✦ —</div>
			</div>

			<!-- Image preview -->
			<!-- svelte-ignore a11y_interactive_supports_focus -->
			<div
				class="edit-img-zone"
				onclick={() => editFileInput?.click()}
				role="button"
				onkeydown={(e) => e.key === 'Enter' && editFileInput?.click()}
				tabindex="0"
				title="Змінити фото"
			>
				<img
					src={editPreviewUrl ?? editPlant.imageUrl}
					alt={editPlant.name}
					class="edit-img-preview"
				/>
				<div class="edit-img-overlay">Змінити фото</div>
			</div>

			<input
				bind:this={editFileInput}
				type="file"
				accept="image/*"
				onchange={handleEditFileInput}
				style="display:none"
			/>

			<div class="edit-fields">
				<div class="field">
					<label for="edit-name" class="label">Назва українською</label>
					<input
						id="edit-name"
						type="text"
						bind:value={editName}
						class="input"
						placeholder="Назва рослини"
						onkeydown={(e) => e.key === 'Enter' && saveEdit()}
					/>
				</div>

				<div class="field">
					<label for="edit-latin" class="label">
						Назва латинською <span class="optional">(необов'язково)</span>
					</label>
					<input
						id="edit-latin"
						type="text"
						bind:value={editLatinName}
						class="input latin-input"
						placeholder="Назва латинською"
						onkeydown={(e) => e.key === 'Enter' && saveEdit()}
					/>
				</div>

				{#if editError}
					<p class="edit-error">{editError}</p>
				{/if}
			</div>

			<div class="modal-actions">
				<button class="btn-cancel" onclick={closeEdit} disabled={editSaving}>Скасувати</button>
				<button class="btn-save" onclick={saveEdit} disabled={editSaving}>
					{editSaving ? 'Збереження…' : 'Зберегти зміни'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
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
		margin-bottom: 0.3rem;
	}

	.count {
		font-size: 0.85rem;
		color: var(--text-muted);
		font-style: italic;
	}

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
		max-width: 280px;
		margin: 0 auto;
		line-height: 1.6;
	}

	/* ── Grid ────────────────────────────────────────────────────────────── */
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
		gap: 2.5rem 2rem;
		padding: 0.5rem 1rem 1rem;
	}

	.plant-card {
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 3px;
		box-shadow:
			3px 5px 12px var(--shadow),
			0 0 0 1px rgba(200, 185, 154, 0.3);
		transform: rotate(var(--rot));
		transition:
			transform 0.25s ease,
			box-shadow 0.25s ease;
		position: relative;
		cursor: default;
	}

	.plant-card::before {
		content: '';
		position: absolute;
		inset: 3px;
		border: 1px solid rgba(200, 185, 154, 0.25);
		pointer-events: none;
		z-index: 1;
	}

	.plant-card:hover {
		transform: rotate(0deg) translateY(-6px);
		box-shadow:
			6px 12px 28px rgba(60, 40, 10, 0.22),
			0 0 0 1px rgba(200, 185, 154, 0.4);
		z-index: 2;
	}

	.card-img-wrap {
		aspect-ratio: 3 / 4;
		overflow: hidden;
	}

	.card-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.35s ease;
		display: block;
	}

	.plant-card:hover .card-img {
		transform: scale(1.04);
	}

	.card-label {
		padding: 0.625rem 0.875rem 0.875rem;
		background: var(--card);
		border-top: 1px solid var(--border);
	}

	.label-rule {
		width: 2rem;
		height: 1px;
		background: var(--accent-brown);
		margin: 0 auto 0.4rem;
		opacity: 0.5;
	}

	.plant-name {
		font-family: 'Lora', serif;
		font-style: italic;
		font-size: 0.9rem;
		color: var(--text);
		text-align: center;
		line-height: 1.4;
	}

	.latin-name {
		font-family: 'Lora', serif;
		font-style: italic;
		font-size: 0.75rem;
		color: var(--text-muted);
		text-align: center;
		margin-top: 0.2rem;
		line-height: 1.3;
	}

	/* ── Card action buttons ─────────────────────────────────────────────── */
	.card-btn {
		position: absolute;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		border: 2px solid var(--bg);
		font-size: 0.7rem;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition: opacity 0.2s;
		cursor: pointer;
		line-height: 1;
		z-index: 3;
		color: white;
	}

	.plant-card:hover .card-btn {
		opacity: 1;
	}

	.edit-btn {
		top: -10px;
		left: -10px;
		background: var(--accent-green);
		font-size: 0.85rem;
	}

	.edit-btn:hover {
		background: #3a6a3a;
	}

	.delete-btn {
		top: -10px;
		right: -10px;
		background: #b03a2e;
	}

	.delete-btn:hover {
		background: #8b2e23;
	}

	/* ── Modal shared ────────────────────────────────────────────────────── */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(20, 10, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		backdrop-filter: blur(2px);
		padding: 1rem;
	}

	.modal {
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 12px;
		box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
		width: 90%;
	}

	.modal-sm {
		max-width: 340px;
		padding: 2rem;
		text-align: center;
	}

	.modal-icon {
		font-size: 2rem;
		color: var(--accent-brown);
		margin-bottom: 0.75rem;
		opacity: 0.6;
	}

	.modal-sm h3 {
		font-size: 1.2rem;
		margin-bottom: 0.5rem;
		color: var(--text);
	}

	.modal-sm p {
		color: var(--text-muted);
		font-size: 0.875rem;
		margin-bottom: 1.5rem;
	}

	.modal-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
	}

	.modal-sm .modal-actions {
		justify-content: center;
	}

	.btn-cancel {
		padding: 0.625rem 1.375rem;
		background: none;
		border: 1px solid var(--border);
		border-radius: 6px;
		color: var(--text-muted);
		font-size: 0.9rem;
		transition: background-color 0.15s;
	}

	.btn-cancel:hover:not(:disabled) {
		background: #f0e8d0;
	}

	.btn-danger {
		padding: 0.625rem 1.375rem;
		background: #b03a2e;
		border: none;
		border-radius: 6px;
		color: white;
		font-size: 0.9rem;
		transition: background-color 0.15s;
	}

	.btn-danger:hover:not(:disabled) {
		background: #8b2e23;
	}

	.btn-save {
		padding: 0.625rem 1.375rem;
		background: var(--header);
		border: none;
		border-radius: 6px;
		color: #f0e8d0;
		font-size: 0.9rem;
		transition: background-color 0.15s;
	}

	.btn-save:hover:not(:disabled) {
		background: #3d6b3d;
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* ── Edit modal ──────────────────────────────────────────────────────── */
	.modal-edit {
		max-width: 480px;
		padding: 0;
		overflow: hidden;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		padding: 1.5rem 1.75rem 0;
		text-align: center;
		flex-shrink: 0;
	}

	.modal-header h3 {
		font-size: 1.35rem;
		color: var(--text);
		margin-bottom: 0.3rem;
	}

	.modal-ornament {
		color: var(--accent-brown);
		letter-spacing: 0.3em;
		font-size: 0.8rem;
		margin-bottom: 1rem;
	}

	.edit-img-zone {
		position: relative;
		height: 200px;
		cursor: pointer;
		overflow: hidden;
		flex-shrink: 0;
	}

	.edit-img-preview {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		transition: transform 0.3s;
	}

	.edit-img-zone:hover .edit-img-preview {
		transform: scale(1.03);
	}

	.edit-img-overlay {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.35);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: 'Lora', serif;
		font-size: 0.95rem;
		opacity: 0;
		transition: opacity 0.2s;
	}

	.edit-img-zone:hover .edit-img-overlay {
		opacity: 1;
	}

	.edit-fields {
		padding: 1.25rem 1.75rem 0;
		overflow-y: auto;
	}

	.field {
		margin-bottom: 1rem;
	}

	.label {
		display: block;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
		margin-bottom: 0.35rem;
	}

	.optional {
		font-size: 0.7rem;
		text-transform: none;
		letter-spacing: 0;
		color: var(--border);
		font-style: italic;
	}

	.input {
		width: 100%;
		padding: 0.7rem 0.875rem;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: white;
		font-family: 'Lora', serif;
		font-size: 0.95rem;
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

	.latin-input {
		font-style: italic;
	}

	.edit-error {
		color: #b03a2e;
		font-size: 0.8rem;
		padding: 0.4rem 0.6rem;
		background: #fdecea;
		border-radius: 4px;
		border-left: 3px solid #b03a2e;
		margin-bottom: 0.75rem;
	}

	.modal-edit .modal-actions {
		padding: 1rem 1.75rem 1.5rem;
		flex-shrink: 0;
		border-top: 1px solid var(--border);
		margin-top: 1.25rem;
	}
</style>
