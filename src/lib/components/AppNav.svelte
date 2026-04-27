<script lang="ts">
	import { page } from '$app/stores';

	let {
		user,
		isAdmin
	}: {
		user: { nip: string; nama: string } | null;
		isAdmin: boolean;
	} = $props();

	const modules = [
		{ href: '/analytics', label: 'Dashboard Kepegawaian' },
		{ href: '/kgb', label: 'KGB Monitor' }
	];

	function isActive(href: string): boolean {
		return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
	}
</script>

<nav style="background: #113F51;" class="shadow-lg">
	<!-- Gold accent line at bottom -->
	<div style="border-bottom: 2px solid #D5C58A;">
		<div class="max-w-screen-2xl mx-auto px-4 py-2.5 flex items-center gap-4">
			<!-- Brand -->
			<div class="flex items-center gap-3 shrink-0">
				<div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
					style="background: #D5C58A;">
					<span style="color: #113F51;" class="font-bold text-xs font-heading">BP3</span>
				</div>
				<div class="hidden sm:block">
					<p class="font-semibold text-sm leading-tight text-white font-heading">Kepegawaian BP3KP Jawa III</p>
					<p class="text-xs" style="color: rgba(213,197,138,0.7);">Kementerian PKP</p>
				</div>
			</div>

			<!-- Module tabs -->
			<div class="flex items-center gap-1 ml-2">
				{#each modules as mod}
					<a
						href={mod.href}
						class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
						style={isActive(mod.href)
							? 'background:#D5C58A; color:#113F51; font-weight:600;'
							: 'color:rgba(255,255,255,0.65);'}
						onmouseenter={(e) => { if (!isActive(mod.href)) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
						onmouseleave={(e) => { if (!isActive(mod.href)) { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)'; } }}
					>
						{mod.label}
					</a>
				{/each}
			</div>

			<!-- Right side -->
			<div class="ml-auto flex items-center gap-2 shrink-0">
				{#if isAdmin}
					<a
						href="/admin"
						class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
						style={$page.url.pathname.startsWith('/admin')
							? 'background:#D5C58A; color:#113F51; font-weight:600;'
							: 'color:rgba(255,255,255,0.65);'}
					>
						Admin
					</a>
				{/if}

				{#if user}
					<span class="text-xs hidden md:block" style="color:rgba(213,197,138,0.8);">{user.nama}</span>
					<form method="POST" action="/auth/logout">
						<button
							type="submit"
							class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-white/60 hover:text-white"
							style="border: 1px solid rgba(255,255,255,0.2);"
							onmouseenter={(e) => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'}
							onmouseleave={(e) => (e.currentTarget as HTMLElement).style.background = ''}
						>
							Keluar
						</button>
					</form>
				{/if}
			</div>
		</div>
	</div>
</nav>
