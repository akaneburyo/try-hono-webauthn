import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
	name: text('name').notNull(),
	email: text('email').unique().notNull(),
});

export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey().notNull(),
	userId: integer('userId')
		.references(() => users.id)
		.unique()
		.notNull(),
	createdAt: text('createdAt').notNull(),
	expiresAt: text('expiresAt').notNull(),
});

export const devices = sqliteTable('devices', {
	id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
	userId: integer('userId')
		.references(() => users.id)
		.notNull(),
	credentialPublicKey: text('credentialPublicKey').notNull(),
	credentialID: text('credentialID').notNull(),
	counter: integer('counter').notNull(),
	transports: text('transports').notNull(),
});

export const passkeyChallenges = sqliteTable('passkeyChallenges', {
	id: text('id').primaryKey().notNull(),
	challenge: text('challenge').notNull(),
	sessionId: text('sessionId').references(() => sessions.id),
});
