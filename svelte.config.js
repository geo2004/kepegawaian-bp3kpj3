import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({ runtime: 'nodejs20.x' }),
		csrf: {
			// Disable origin check so the GRIYA kiosk (Electron) can submit forms.
			// The app uses its own session-cookie auth, so CSRF origin check is redundant.
			checkOrigin: false
		}
	}
};

export default config;
