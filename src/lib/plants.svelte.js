/** @typedef {{ id: number, name: string, latinName?: string, imageUrl: string }} Plant */

/** @type {Plant[]} */
let plants = $state([]);
let loading = $state(false);
let error = $state('');

export const plantsStore = {
	get list() {
		return plants;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},

	async load() {
		loading = true;
		error = '';
		try {
			const res = await fetch('/api/plants');
			if (!res.ok) throw new Error('Server error');
			plants = await res.json();
		} catch {
			error = 'Не вдалося завантажити дані';
		} finally {
			loading = false;
		}
	},

	/**
	 * @param {string} name
	 * @param {string} latinName
	 * @param {File} file
	 */
	async add(name, latinName, file) {
		const formData = new FormData();
		formData.append('name', name);
		formData.append('latinName', latinName);
		formData.append('image', file);

		const res = await fetch('/api/plants', { method: 'POST', body: formData });
		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			throw new Error(body.error ?? 'Upload failed');
		}
		/** @type {Plant} */
		const plant = await res.json();
		plants = [...plants, plant];
	},

	/**
	 * @param {number} id
	 * @param {string} name
	 * @param {string} latinName
	 * @param {File | null} file
	 */
	async update(id, name, latinName, file) {
		const formData = new FormData();
		formData.append('name', name);
		formData.append('latinName', latinName);
		if (file) formData.append('image', file);

		const res = await fetch(`/api/plants/${id}`, { method: 'PATCH', body: formData });
		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			throw new Error(body.error ?? 'Update failed');
		}
		/** @type {Plant} */
		const updated = await res.json();
		plants = plants.map((p) => (p.id === id ? updated : p));
	},

	/** @param {number} id */
	async remove(id) {
		const res = await fetch(`/api/plants/${id}`, { method: 'DELETE' });
		if (!res.ok) throw new Error('Delete failed');
		plants = plants.filter((p) => p.id !== id);
	}
};
