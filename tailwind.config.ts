import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				heading: ['Poppins', 'Inter', 'system-ui', 'sans-serif']
			},
			colors: {
				pkp: {
					teal:      '#113F51',
					mid:       '#0E5B73',
					gold:      '#D5C58A',
					'gold-dk': '#CDB278',
					bg:        '#f5f7f8'
				}
			}
		}
	},
	plugins: []
} satisfies Config;
