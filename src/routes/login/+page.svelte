<script>
	import { enhance } from '$app/forms';

	/** @type {{ form?: { error?: string } | null }} */
	let { form } = $props();

	let loading = $state(false);
	let showPassword = $state(false);
</script>

<svelte:head>
	<title>Vita Gerbarium — Вхід</title>
</svelte:head>

<div class="page">
	<div class="card">
		<div class="logo-deco">✦ &nbsp; ❧ &nbsp; ✦</div>
		<h1 class="title">Vita Gerbarium</h1>
		<p class="subtitle">Гербарій рослин</p>
		<div class="divider">— ✦ —</div>

		<p class="prompt">Введіть пароль для доступу</p>

		<form
			method="POST"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
		>
			<div class="field">
				<label for="password" class="label">Пароль</label>
				<div class="input-wrap">
					<input
						id="password"
						name="password"
						type={showPassword ? 'text' : 'password'}
						placeholder="••••••••"
						class="input"
						class:error={form?.error}
						autocomplete="current-password"
						required
					/>
					<button
						type="button"
						class="toggle-pw"
						onclick={() => (showPassword = !showPassword)}
						aria-label="Показати пароль"
					>
						{showPassword ? '🙈' : '👁'}
					</button>
				</div>
				{#if form?.error}
					<p class="error-msg">{form.error}</p>
				{/if}
			</div>

			<button type="submit" class="btn-login" disabled={loading}>
				{loading ? 'Перевірка…' : 'Увійти до гербарію'}
			</button>
		</form>
	</div>

	<footer class="foot">✦ &nbsp; Vita Gerbarium &nbsp; ✦</footer>
</div>

<style>
	.page {
		min-height: 100vh;
		background-color: var(--bg);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
	}

	.card {
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 2.5rem 2rem;
		width: 100%;
		max-width: 400px;
		box-shadow: 0 8px 32px var(--shadow);
		text-align: center;
	}

	.logo-deco {
		font-size: 0.85rem;
		color: #c8aa78;
		letter-spacing: 0.4em;
		margin-bottom: 0.5rem;
	}

	.title {
		font-size: 2rem;
		font-style: italic;
		color: var(--header);
		letter-spacing: 0.03em;
		margin-bottom: 0.2rem;
	}

	.subtitle {
		font-size: 0.7rem;
		color: var(--text-muted);
		letter-spacing: 0.35em;
		text-transform: uppercase;
		margin-bottom: 1rem;
	}

	.divider {
		color: var(--accent-brown);
		letter-spacing: 0.3em;
		font-size: 0.85rem;
		margin-bottom: 1.5rem;
	}

	.prompt {
		font-size: 0.9rem;
		color: var(--text-muted);
		font-style: italic;
		margin-bottom: 1.5rem;
	}

	.field {
		margin-bottom: 1.25rem;
		text-align: left;
	}

	.label {
		display: block;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		margin-bottom: 0.4rem;
	}

	.input-wrap {
		position: relative;
	}

	.input {
		width: 100%;
		padding: 0.75rem 2.5rem 0.75rem 1rem;
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

	.input.error {
		border-color: #b03a2e;
	}

	.toggle-pw {
		position: absolute;
		right: 0.6rem;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		font-size: 1rem;
		cursor: pointer;
		padding: 0.2rem;
		line-height: 1;
		opacity: 0.6;
	}

	.toggle-pw:hover {
		opacity: 1;
	}

	.error-msg {
		color: #b03a2e;
		font-size: 0.8rem;
		margin-top: 0.4rem;
		padding: 0.4rem 0.6rem;
		background: #fdecea;
		border-radius: 4px;
		border-left: 3px solid #b03a2e;
		text-align: left;
	}

	.btn-login {
		width: 100%;
		padding: 0.875rem;
		background: var(--header);
		color: #f0e8d0;
		border: none;
		border-radius: 6px;
		font-family: 'Lora', serif;
		font-size: 1rem;
		letter-spacing: 0.05em;
		transition: background-color 0.2s;
	}

	.btn-login:hover:not(:disabled) {
		background: #3d6b3d;
	}

	.btn-login:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.foot {
		margin-top: 2rem;
		color: var(--text-muted);
		font-size: 0.75rem;
		letter-spacing: 0.25em;
	}
</style>
