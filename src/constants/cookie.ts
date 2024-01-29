export const Cookie = {
	session: {
		key: 'session',
		secret: 'secret', // TODO envに置く
	},
	challenge: {
		key: 'challenge',
		secret: 'secret',
	},
} as const;
