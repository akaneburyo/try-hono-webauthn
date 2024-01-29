import { z } from 'zod';
import { users, sessions } from './table';

import { createInsertSchema } from 'drizzle-zod';

const usersSchema = createInsertSchema(users);
export type User = z.infer<typeof usersSchema>;

const sessionsSchema = createInsertSchema(sessions);
export type Session = z.infer<typeof sessionsSchema>;
