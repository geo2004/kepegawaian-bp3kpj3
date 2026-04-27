<script lang="ts">
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	const navItems = [
		{ href: '/admin', label: 'Dashboard', icon: '📊' },
		{ href: '/admin/employees', label: 'Daftar Pegawai', icon: '👥' }
	];

	const currentPath = $derived($page.url.pathname);
</script>

<div class="flex h-full">
	<!-- Sidebar -->
	<aside class="w-60 flex flex-col fixed h-full shadow-lg" style="background: #113F51;">
		<!-- Brand -->
		<div class="p-5" style="border-bottom: 2px solid #D5C58A;">
			<div class="flex items-center gap-2.5">
				<div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
					style="background: #D5C58A;">
					<span style="color: #113F51;" class="font-bold text-xs font-heading">BP3</span>
				</div>
				<div>
					<p class="text-white font-semibold text-sm font-heading leading-tight">Kepegawaian</p>
					<p class="text-xs" style="color: rgba(213,197,138,0.7);">Admin Panel</p>
				</div>
			</div>
		</div>

		<nav class="flex-1 p-3 space-y-1">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
					style={currentPath === item.href
						? 'background:#D5C58A; color:#113F51; font-weight:600;'
						: 'color:rgba(255,255,255,0.65);'}
				>
					<span>{item.icon}</span>
					{item.label}
				</a>
			{/each}

			<a
				href="/admin/import"
				class="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
				style={currentPath === '/admin/import'
					? 'background:#D5C58A; color:#113F51; font-weight:600;'
					: 'color:rgba(255,255,255,0.65);'}
			>
				<span>📂</span>
				Import XLSX
			</a>

			<a
				href="/admin/export"
				download
				class="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
				style="color:rgba(213,197,138,0.85);"
			>
				<span>📥</span>
				Export XLSX
			</a>
		</nav>

		<div class="p-3" style="border-top: 1px solid rgba(255,255,255,0.1);">
			<div class="px-4 py-2 mb-1">
				<p class="text-white text-xs font-medium truncate">{data.user?.nama}</p>
				<p class="text-xs truncate" style="color:rgba(255,255,255,0.4);">{data.user?.nip}</p>
			</div>
			<a
				href="/analytics"
				class="flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition-all mb-0.5"
				style="color:rgba(255,255,255,0.55);"
				onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color='#fff'; }}
				onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.background=''; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.55)'; }}
			>
				← Dashboard Kepegawaian
			</a>
			<a
				href="/kgb"
				class="flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition-all mb-0.5"
				style="color:rgba(255,255,255,0.55);"
				onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color='#fff'; }}
				onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.background=''; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.55)'; }}
			>
				← KGB Monitor
			</a>
			<form action="/auth/logout" method="POST">
				<button
					type="submit"
					class="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition-all mt-1"
					style="color:rgba(255,255,255,0.4);"
					onmouseenter={(e) => { (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color='#fca5a5'; }}
					onmouseleave={(e) => { (e.currentTarget as HTMLElement).style.background=''; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.4)'; }}
				>
					🚪 Keluar
				</button>
			</form>
		</div>
	</aside>

	<!-- Main content -->
	<div class="flex-1 ml-60 h-full overflow-y-auto">
		{@render children()}
	</div>
</div>
