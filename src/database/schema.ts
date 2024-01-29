import { createInsertSchema } from 'drizzle-zod';
import { users, sessions } from './table';

export const usersSchema = createInsertSchema(users);
export const sessionsSchema = createInsertSchema(sessions);
