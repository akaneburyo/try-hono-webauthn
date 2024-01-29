import type { FC } from 'hono/jsx';
import { Session, User } from '../database/type';

import { ApiRoutes } from '../constants';

export const TopPage: FC<{ users: User[]; sessions: Session[] }> = (props) => {
	return (
		<>
			<main>
				<section class="section">
					<h1 class="title">Hello World</h1>
				</section>
				<section class="section">
					<div class="content">
						<h2>Users</h2>
						<ul>
							{props.users.map((user) => (
								<li key={user.id}>
									{user.id}: {user.name}, {user.email}
								</li>
							))}
						</ul>
					</div>
				</section>
				<section class="section">
					<div class="content">
						<h2>Session</h2>
						<ul>
							{props.sessions.map((session) => (
								<li key={session.id}>
									{session.id}: {session.userId}
								</li>
							))}
						</ul>
					</div>
				</section>

				<section class="section">
					<div class="content">
						<button class="button is-danger" onclick={'window.initPasskey()'}>
							Init passkey
						</button>
					</div>
				</section>

				<section class="section">
					<div class="content">
						<button class="button is-danger" hx-trigger="click" hx-post="/api/logout">
							Logout
						</button>
					</div>
				</section>
			</main>
		</>
	);
};
