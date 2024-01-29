export const ApiRoutes = {
	register: '/api/register',
	passkeyOptions: '/api/auth/passkey/options',
	passkeyRegister: '/api/auth/passkey/register',
	passkeyVerify: '/api/auth/passkey/verify',
	logout: '/api/logout',
} as const;

export const FrontendRoutes = {
	top: '/',
	signup: '/signup',
	signin: '/signin',
} as const;
