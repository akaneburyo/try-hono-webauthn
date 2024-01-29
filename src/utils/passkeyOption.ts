import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { nanoid } from 'nanoid';

export const generatePasskeyOptions = ({
	rpName,
	rpId,
	user,
}: {
	rpName: string;
	rpId: string;
	user?: { id: number; name: string; displayName: string };
}) => {
	return {
		challenge: isoBase64URL.fromString(nanoid(32)),
		rp: { name: rpName, id: rpId },
		user: user,
	};
};
