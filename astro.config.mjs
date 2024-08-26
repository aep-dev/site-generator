import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import * as fs from 'fs';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'AEP',
			social: {
				github: 'https://github.com/withastro/starlight',
			},
			sidebar: JSON.parse(fs.readFileSync("sidebar.json")),
		}),
	],
});
