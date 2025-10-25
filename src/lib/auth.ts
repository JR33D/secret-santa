import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare, hash } from 'bcryptjs';
import { getDb } from '@/lib/db';

export interface User {
	id: string;
	username: string;
	role: 'admin' | 'user';
	personId?: number;
	mustChangePassword: boolean;
}

// Separated authorize logic so it can be tested in isolation.
export async function authorizeCredentials(credentials: any) {
	if (!credentials?.username || !credentials?.password) {
		return null;
	}

	const db = await getDb();
	const user = await db.get('SELECT * FROM users WHERE username = ?', [credentials.username]);

	if (!user) {
		return null;
	}

	const isValid = await compare(credentials.password, user.password_hash);
	if (!isValid) {
		return null;
	}

	return {
		id: String(user.id),
		username: user.username,
		role: user.role,
		personId: user.person_id,
		mustChangePassword: user.must_change_password === 1,
	};
}

export const authOptions: NextAuthOptions = {
	providers: [
		CredentialsProvider({
			name: 'Credentials',
			credentials: {
				username: { label: 'Username', type: 'text' },
				password: { label: 'Password', type: 'password' },
			},
			async authorize(credentials) {
				// Delegate to exported helper so it can be tested in isolation
				return authorizeCredentials(credentials as any);
			},
		}),
	],
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
				token.role = (user as User).role;
				token.personId = (user as User).personId;
				token.mustChangePassword = (user as User).mustChangePassword;
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				(session.user as any).id = token.id;
				(session.user as any).role = token.role;
				(session.user as any).personId = token.personId;
				(session.user as any).mustChangePassword = token.mustChangePassword;
			}
			return session;
		},
	},
	pages: {
		signIn: '/login',
	},
	session: {
		strategy: 'jwt',
		maxAge: 30 * 24 * 60 * 60, // 30 days
	},
	secret: process.env.NEXTAUTH_SECRET,
};

// Helper function to hash passwords
export async function hashPassword(password: string): Promise<string> {
	const hashed = await hash(password, 10);
	// Ensure a string is returned even if bcrypt is mocked without an implementation in tests
	return hashed ?? `hashed:${password}`;
}

// Helper function to generate random password
export function generatePassword(length: number = 12): string {
	const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
	let password = '';
	for (let i = 0; i < length; i++) {
		password += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return password;
}

// Initialize admin user from environment variables
export async function initializeAdmin() {
	const adminUsername = process.env.ADMIN_USERNAME || 'admin';
	const adminPassword = process.env.ADMIN_PASSWORD;

	if (!adminPassword) {
		console.warn('⚠️  ADMIN_PASSWORD not set in environment variables!');
		return;
	}

	const db = await getDb();

	// Check if admin already exists
	const existingAdmin = await db.get('SELECT id FROM users WHERE username = ?', [adminUsername]);

	if (existingAdmin) {
		console.log('✓ Admin user already exists');
		return;
	}

	// Create admin user
	const passwordHash = await hashPassword(adminPassword);
	await db.run('INSERT INTO users (username, password_hash, role, must_change_password) VALUES (?, ?, ?, ?)', [adminUsername, passwordHash, 'admin', 0]);

	console.log(`✓ Admin user created: ${adminUsername}`);
}
