<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let showPassword = $state(false);
	let loading = $state(false);
</script>

<svelte:head>
	<title>Masuk — Kepegawaian BP3KP Jawa III</title>
</svelte:head>

<div class="min-h-screen flex flex-col" style="background: var(--pkp-bg);">
	<!-- Header bar -->
	<header style="background: #113F51;">
		<div class="px-5 py-3 max-w-lg mx-auto flex items-center gap-3">
			<div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style="background: #D5C58A;">
				<span style="color: #113F51;" class="font-bold text-xs">BP3</span>
			</div>
			<p class="text-white text-sm font-semibold font-heading">Kepegawaian BP3KP Jawa III</p>
		</div>
		<div style="background: #D5C58A; height: 3px;"></div>
	</header>

	<div class="flex-1 flex items-center justify-center px-4 py-12">
		<div class="w-full max-w-sm">
			<div class="bg-white rounded-xl shadow-sm overflow-hidden" style="border-bottom: 4px solid #D5C58A;">

				<!-- Card header -->
				<div class="px-6 py-5 text-center" style="background: #113F51;">
					<div class="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
						style="background: rgba(213,197,138,0.2); border: 2px solid rgba(213,197,138,0.4);">
						<svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
								d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
					</div>
					<h1 class="text-white font-bold text-base font-heading">Sistem Kepegawaian</h1>
					<p class="text-xs mt-0.5" style="color: rgba(213,197,138,0.8);">BP3KP Jawa III · Kementerian PKP</p>
				</div>

				<div class="px-8 py-7">
					<p class="text-gray-500 text-sm text-center mb-6">Masukkan NIP untuk mengakses sistem</p>

					{#if form?.error}
						<div class="mb-5 p-3 rounded-lg text-sm border-l-4"
							style="background: #fff3cd; border-color: #CDB278; color: #856404;">
							⚠ {form.error}
						</div>
					{/if}

					<form method="POST" onsubmit={() => (loading = true)} class="space-y-5">
						<div>
							<label for="nip" class="block text-sm font-medium text-gray-700 mb-1.5">NIP / NRP</label>
							<input
								id="nip"
								name="nip"
								type="text"
								inputmode="numeric"
								autocomplete="username"
								placeholder="Masukkan NIP Anda"
								class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none transition"
								style="focus:border-color: #0E5B73;"
								onfocus={(e) => (e.currentTarget as HTMLElement).style.borderColor = '#0E5B73'}
								onblur={(e) => (e.currentTarget as HTMLElement).style.borderColor = ''}
								required
							/>
						</div>

						<div>
							<label for="password" class="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
							<div class="relative">
								<input
									id="password"
									name="password"
									type={showPassword ? 'text' : 'password'}
									inputmode="numeric"
									autocomplete="current-password"
									placeholder="Masukkan password Anda"
									class="w-full px-4 py-2.5 pr-11 border border-gray-300 rounded-lg text-sm focus:outline-none transition"
									onfocus={(e) => (e.currentTarget as HTMLElement).style.borderColor = '#0E5B73'}
									onblur={(e) => (e.currentTarget as HTMLElement).style.borderColor = ''}
									required
								/>
								<button
									type="button"
									onclick={() => (showPassword = !showPassword)}
									class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
									tabindex="-1"
									aria-label="Toggle password visibility"
								>
									{#if showPassword}
										<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
										</svg>
									{:else}
										<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
										</svg>
									{/if}
								</button>
							</div>
						</div>

						<button
							type="submit"
							disabled={loading}
							class="w-full py-2.5 rounded-lg font-semibold text-white text-sm transition-opacity hover:opacity-90 disabled:opacity-50 font-heading"
							style="background: #0E5B73;"
						>
							{loading ? 'Memproses...' : 'Masuk'}
						</button>
					</form>
				</div>
			</div>

			<p class="text-center text-xs mt-5" style="color: #6b7280;">
				© {new Date().getFullYear()} BP3KP Jawa III · Kementerian Perumahan dan Kawasan Permukiman
			</p>
		</div>
	</div>
</div>
