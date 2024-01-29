import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { poweredBy } from 'hono/powered-by';
import { zValidator } from '@hono/zod-validator';
import { getSignedCookie, setSignedCookie, deleteCookie } from 'hono/cookie';
import { verifyRegistrationResponse, verifyAuthenticationResponse, VerifyRegistrationResponseOpts } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';

import { nanoid } from 'nanoid';

import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { z } from 'zod';

import { sessionMiddleware } from './middlewares/session';
import { users, sessions, passkeyChallenges, devices } from './database/table';
import { usersSchema } from './database/schema';
import { Layout } from './components/layout';
import { TopPage, SignupPage, SigninPage } from './components';

import type { Bindings } from './types/bindings';
import { generatePasskeyOptions } from './utils/passkeyOption';

import { ApiRoutes, Cookie, FrontendRoutes, Passkey } from './constants';

const app = new Hono<{ Bindings: Bindings }>();

app.use(logger());
app.use(poweredBy());

// Pages
app.get(
	FrontendRoutes.top,
	sessionMiddleware({ cookie: { key: Cookie.session.key, secret: Cookie.session.secret }, redirect: true }),
	async (c) => {
		const db = drizzle(c.env.DB);
		if (c.var.user === null) {
			return c.redirect('/signin');
		}

		const usersResult = await db.select().from(users).all();
		const sessionsResult = await db.select().from(sessions).all();
		return c.html(
			<Layout title="Top">
				<TopPage users={usersResult} sessions={sessionsResult} />
			</Layout>
		);
	}
);

app.get(FrontendRoutes.signup, async (c) => {
	return c.html(
		<Layout title="Signup">
			<SignupPage />
		</Layout>
	);
});

app.get(FrontendRoutes.signin, async (c) => {
	return c.html(
		<Layout title="Signin">
			<SigninPage />
		</Layout>
	);
});

// API
app.post(
	ApiRoutes.register,
	zValidator(
		'form',
		z.object({
			name: usersSchema.shape.name,
			email: usersSchema.shape.email,
		}),
		(result, c) => {
			if (!result.success) return c.json({ message: 'Invalid data' }, 422);
		}
	),

	async (c) => {
		const data = c.req.valid('form');
		const db = drizzle(c.env.DB);
		try {
			const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
			const newSession = {
				id: nanoid(),
				createdAt: new Date().toUTCString(),
				expiresAt: expires.toUTCString(),
			};

			// TODO: トランザクションつかう&DBのロジックを外に出す
			const results = await db.insert(users).values(data).onConflictDoNothing().returning({ id: users.id }).execute();
			if (results.length === 0) {
				return c.json({ message: 'Error' }, 400);
			}
			await db
				.insert(sessions)
				.values({
					userId: results[0].id,
					...newSession,
				})
				.onConflictDoUpdate({ target: sessions.userId, set: newSession })
				.execute();

			await setSignedCookie(c, 'session', newSession.id, 'secret', {
				// secure: true,
				httpOnly: true,
				sameSite: 'Strict',
				expires,
			});

			c.header('HX-Redirect', FrontendRoutes.top); // /へリダイレクト
			return c.json({ message: 'Success' }, 200);
		} catch (err) {
			return c.json({ message: 'Error' }, 400);
		}
	}
);

app.get(ApiRoutes.passkeyOptions, async (c) => {
	// passkeyの規格に則って、clientで使用するoptionsを返す
	const db = drizzle(c.env.DB);
	const session = await getSignedCookie(c, Cookie.session.secret, Cookie.session.key);

	const user = await (async () => {
		if (!session) return;

		const sessionResult = await db.select().from(sessions).where(eq(sessions.id, session)).execute();
		if (sessionResult.length === 0) return;
		const user = await db.select().from(users).where(eq(users.id, sessionResult[0].userId)).execute();
		return user;
	})();

	const passkeyOptions = generatePasskeyOptions({
		rpName: Passkey.rpName,
		rpId: Passkey.rpId,
		user: user && {
			id: user[0].id,
			name: user[0].email,
			displayName: user[0].name,
		},
	});

	const challengeId = nanoid();
	await db
		.insert(passkeyChallenges)
		.values({
			id: challengeId,
			challenge: passkeyOptions.challenge,
			sessionId: session || undefined,
		})
		.execute();

	await setSignedCookie(c, Cookie.challenge.key, challengeId, Cookie.challenge.secret, {
		httpOnly: true,
		// secure: true,
		sameSite: 'Strict',
		expires: new Date(Date.now() + 10 * 60 * 1000),
	});

	return c.json(passkeyOptions, 200);
});

app.post(ApiRoutes.passkeyRegister, async (c) => {
	// passkey認証を登録する
	const body: any = await c.req.json(); // TODO type

	const db = drizzle(c.env.DB);

	const challengeId = await getSignedCookie(c, Cookie.challenge.secret, Cookie.challenge.key);
	const sessionId = await getSignedCookie(c, Cookie.session.secret, Cookie.session.key);

	if (!challengeId || !sessionId) {
		return new Response('Invalid challenge', { status: 400 });
	}

	const challengeResult = await db.select().from(passkeyChallenges).where(eq(passkeyChallenges.id, challengeId)).execute();
	const sessionResult = await db.select().from(sessions).where(eq(sessions.id, sessionId)).execute();

	if (challengeResult.length === 0 || sessionResult.length === 0) {
		return new Response('Invalid challenge', { status: 400 });
	}

	const opts: VerifyRegistrationResponseOpts = {
		response: body,
		expectedChallenge: `${challengeResult[0].challenge}`,
		expectedOrigin: Passkey.expectedOrigin,
		expectedRPID: Passkey.rpId,
		requireUserVerification: true,
	};

	const { verified, registrationInfo } = await verifyRegistrationResponse(opts);

	if (verified && registrationInfo) {
		const { credentialPublicKey, credentialID, counter } = registrationInfo;

		await db.insert(devices).values({
			userId: sessionResult[0].userId,
			credentialPublicKey: isoBase64URL.fromBuffer(credentialPublicKey),
			credentialID: isoBase64URL.fromBuffer(credentialID),
			counter: counter,
			transports: body.response.transports,
		});
	}

	return c.json({ verified });
});

app.post(ApiRoutes.passkeyVerify, async (c) => {
	// passkeyを検証する
	const db = drizzle(c.env.DB);
	const body: any = await c.req.json();

	const challengeId = await getSignedCookie(c, Cookie.challenge.secret, Cookie.challenge.key);
	if (!challengeId) {
		return new Response('Invalid challenge', { status: 400 });
	}

	const challengeResult = await db.select().from(passkeyChallenges).where(eq(passkeyChallenges.id, challengeId)).execute();
	if (challengeResult.length === 0) {
		return new Response('Invalid challenge', { status: 400 });
	}
	const deviceResults = await db.select().from(devices).where(eq(devices.credentialID, body.rawId)).execute();

	if (deviceResults.length === 0) {
		return new Response('Device is not registered with this site', { status: 400 });
	}

	const verification = await verifyAuthenticationResponse({
		response: body,
		expectedChallenge: `${challengeResult[0].challenge}`,
		expectedOrigin: Passkey.expectedOrigin,
		expectedRPID: Passkey.rpId,
		authenticator: {
			...deviceResults[0],
			credentialID: isoBase64URL.toBuffer(deviceResults[0].credentialID),
			credentialPublicKey: isoBase64URL.toBuffer(deviceResults[0].credentialPublicKey),
			transports: deviceResults[0].transports as any, // FIXME dbレベルで型定義変えてもいいかもしれん
		},
		requireUserVerification: true,
	});

	const { verified, authenticationInfo } = verification;
	if (verified) {
		await db.update(devices).set({ counter: authenticationInfo.newCounter }).where(eq(devices.id, deviceResults[0].id)).execute();
	}

	const userDevicesResult = await db
		.select()
		.from(devices)
		.where(eq(devices.credentialID, isoBase64URL.fromBuffer(authenticationInfo.credentialID)))
		.execute();
	if (userDevicesResult.length === 0) {
		return new Response('Device is not registered with this site', { status: 400 });
	}

	const userResult = await db.select().from(users).where(eq(users.id, userDevicesResult[0].userId)).execute();
	if (userResult.length === 0) {
		return new Response('User not found', { status: 400 });
	}

	const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
	const newSession = {
		id: nanoid(),
		createdAt: new Date().toUTCString(),
		expiresAt: expires.toUTCString(),
	};

	await db
		.insert(sessions)
		.values({
			userId: userResult[0].id,
			...newSession,
		})
		.onConflictDoUpdate({ target: sessions.userId, set: newSession })
		.execute();

	await setSignedCookie(c, 'session', newSession.id, 'secret', {
		// secure: true,
		httpOnly: true,
		sameSite: 'Strict',
		expires,
	});

	return c.json({ verified }, 200);
});

app.post(ApiRoutes.logout, async (c) => {
	const sessionId = await getSignedCookie(c, 'secret', 'session');
	if (sessionId) {
		const db = drizzle(c.env.DB);
		await db.delete(passkeyChallenges).where(eq(passkeyChallenges.sessionId, sessionId)).execute();
		await db.delete(sessions).where(eq(sessions.id, sessionId)).execute();
	}
	deleteCookie(c, 'session');

	c.header('HX-Redirect', FrontendRoutes.signin); // /へリダイレクト
	return c.json({}, 200);
});

export default app;
