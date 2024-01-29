import type { Config } from 'drizzle-kit';

export default {
	schema: './src/database/table.ts',
	out: './migrations',
	driver: 'better-sqlite',
	dbCredentials: {
		url: '.mf/d1/DB/DB.sqlite',
	},
} satisfies Config;
