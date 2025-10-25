// Tests for middleware behavior. We mock next-auth/middleware to return the inner function
jest.mock('next-auth/middleware', () => ({ withAuth: (fn: any) => fn }));

jest.mock('next/server', () => ({
	NextResponse: {
		redirect: (u: any) => ({ redirected: true, url: u.toString() }),
		next: () => ({ ok: true }),
	},
}));

import middleware, { config } from '@/lib/middleware';

describe('middleware', () => {
	it('redirects when user must change password', () => {
		const req: any = {
			nextauth: { token: { mustChangePassword: true } },
			nextUrl: { pathname: '/something' },
			url: 'https://example.test/something',
		};

		const res = (middleware as any)(req);
		expect(res).toMatchObject({ redirected: true });
		expect(String(res.url)).toContain('/change-password');
	});

	it('blocks non-admin on admin-only paths', () => {
		const req: any = {
			nextauth: { token: { role: 'user' } },
			nextUrl: { pathname: '/api/people' },
			url: 'https://example.test/api/people',
		};

		const res = (middleware as any)(req);
		// The middleware returns a plain object with status 403 in that branch
		expect(res).toBeDefined();
		expect(res.status).toBe(403);
	});

	it('allows when authorized and not admin-only', () => {
		const req: any = {
			nextauth: { token: { role: 'user' } },
			nextUrl: { pathname: '/home' },
			url: 'https://example.test/home',
		};

		const res = (middleware as any)(req);
		expect(res).toMatchObject({ ok: true });
	});

	it('exports config matcher', () => {
		expect(config).toBeDefined();
		expect(Array.isArray(config.matcher)).toBe(true);
	});
});
