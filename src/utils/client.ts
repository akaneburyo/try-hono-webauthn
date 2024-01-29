import { PasskeyOptions } from '../types/passkeyOptions';

declare global {
	interface Window {
		initPasskey: () => void;
		signinWithPasskey: () => void;
	}
}

declare let navigator: any; // FIXME

const stringToArrayBuffer = (str: string) => {
	return new TextEncoder().encode(str);
};

const arrayBufferToBase64 = (arrayBuffer: any) => {
	const str = String.fromCharCode.apply(null, [...new Uint8Array(arrayBuffer)]);
	const base64 = window.btoa(str);
	return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=*$/g, '');
};

const base64ToArrayBuffer = (base64url: string) => {
	let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
	const paddingLength = 4 - (base64.length % 4);
	if (paddingLength !== 4) {
		base64 += '='.repeat(paddingLength);
	}
	const bstr = atob(base64);
	return Uint8Array.from(bstr, (str) => str.charCodeAt(0));
};

export async function initPasskey() {
	const optionsResponse = await fetch('/api/auth/passkey/options');
	const options: PasskeyOptions = (await optionsResponse.json()) as PasskeyOptions; // FIXME zodつかえる？

	const credentialCreationOptions = {
		challenge: base64ToArrayBuffer(options.challenge),
		rp: {
			name: options.rp.name,
			id: options.rp.id,
		},
		user: {
			id: stringToArrayBuffer(`${options.user?.id || 0}`),
			name: options.user?.name,
			displayName: options.user?.displayName,
		},
		pubKeyCredParams: [
			{ alg: -7, type: 'public-key' }, // -7 (ES256)
			{ alg: -257, type: 'public-key' }, // -257 (RS256)
			{ alg: -8, type: 'public-key' }, // -8 (Ed25519)
		],
		excludeCredentials: [
			{
				id: stringToArrayBuffer(`${options.user?.id || 0}`),
				type: 'public-key',
				transports: ['internal'],
			},
		],
		authenticatorSelection: {
			authenticatorAttachment: 'platform',
			requireResidentKey: true,
			userVerification: 'preferred',
		},
	};
	const credential = await navigator.credentials.create({
		publicKey: credentialCreationOptions,
	});

	await fetch('/api/auth/passkey/register', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			id: arrayBufferToBase64(credential.rawId),
			type: credential.type,
			rawId: arrayBufferToBase64(credential.rawId),
			response: {
				clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON),
				attestationObject: arrayBufferToBase64(credential.response.attestationObject),
				transports: arrayBufferToBase64(credential.response.transports),
			},
		}),
	});

	window.alert('Passkey登録完了');
	return;
}

export async function signinWithPasskey() {
	const optionsResponse = await fetch('/api/auth/passkey/options');
	const options: PasskeyOptions = (await optionsResponse.json()) as PasskeyOptions; // FIXME zodつかえる？

	const credential = await navigator.credentials.get({
		publicKey: {
			challenge: base64ToArrayBuffer(options.challenge),
			userVerification: 'preferred',
		},
		mediation: 'optional',
	});
	const verificationResp = await fetch('/api/auth/passkey/verify', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			id: arrayBufferToBase64(credential.rawId),
			type: credential.type,
			rawId: arrayBufferToBase64(credential.rawId),
			response: {
				clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON),
				authenticatorData: arrayBufferToBase64(credential.response.authenticatorData),
				signature: arrayBufferToBase64(credential.response.signature),
			},
		}),
	});

	console.log(verificationResp);
	window.location.href = '/';
	return;
}

// Load function into window object
declare let window: Window;

console.log('load');
window.initPasskey = initPasskey;
window.signinWithPasskey = signinWithPasskey;
