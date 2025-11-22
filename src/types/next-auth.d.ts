import { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
    interface Session extends DefaultSession {
        user?: {
            id: string;
            role: string;
            mustChangePassword?: boolean;
            personId?: number;
            username: string | null;
        } & DefaultSession['user'];
    }

    interface User extends DefaultUser {
        role: string;
        mustChangePassword?: boolean;
    }
}
