export type PasskeyOptions = {
	challenge: string;
	rp: {
		name: string;
		id: string;
	};
	user?: { id: number; name: string; displayName: string };
};
