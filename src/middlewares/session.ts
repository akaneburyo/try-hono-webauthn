import type { MiddlewareHandler } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { sessions, users } from '../database/table';
import type { User, Session } from '../database/type';

import { getSignedCookie } from 'hono/cookie';
import { HTTPException } from 'hono/http-exception';
import { Bindings } from '../types/bindings';

export const sessionMiddleware = ({ cookie, redirect }: { cookie: { key: string; secret: string }; redirect?: boolean }) => {
	const middleware: MiddlewareHandler<{ Bindings: Bindings; Variables: { user?: User; session?: Session } }> = async (c, next) => {
		const sessionId = await getSignedCookie(c, cookie.secret, cookie.key);
		console.log(sessionId, 'sessionId');

		try {
			if (!sessionId) {
				throw new Error();
			}

			const db = drizzle(c.env.DB);
			const sessionsResult = await db.select().from(sessions).where(eq(sessions.id, sessionId)).execute();
			if (sessionsResult.length === 0 || new Date(sessionsResult[0].expiresAt) < new Date()) {
				// NOTE: expiredの判定はsqlでもできそう
				throw new Error();
			}
			const session = sessionsResult[0];
			const usersResult = await db.select().from(users).where(eq(users.id, session.userId));

			if (usersResult.length === 0) {
				throw new Error();
			}

			c.set('session', session);
			c.set('user', usersResult[0]);
		} catch (e) {
			if (redirect) {
				return c.redirect('/signin');
			} else {
				throw new HTTPException(400, {
					res: new Response('Unauthorized', {
						status: 401,
					}),
				});
			}
		}

		await next();
	};

	return middleware;
};
