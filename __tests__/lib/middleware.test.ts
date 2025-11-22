import { NextRequest, NextResponse } from 'next/server';

// Tests for middleware behavior. We mock next-auth/middleware to return the inner function
jest.mock('next-auth/middleware', () => ({
	withAuth: (fn: (req: NextRequest) => NextResponse) => fn,
}));

jest.mock('next/server', () => ({
	NextResponse: {
		redirect: (u: URL) => ({ redirected: true, url: u.toString() }),
		next: () => ({ ok: true }),
		json: <T = unknown>(body: T, init: { status?: number } = {}) => ({
			...((body as object) || {}), // spread only if it's an object
			status: init.status ?? 200,
			json: async () => body,
		}),
	},
}));

import proxy, { config } from '@/lib/proxy';

interface MockNextRequest extends Omit<NextRequest, 'nextUrl' | 'nextauth' | 'url'> {
	nextauth: {
		token: {
			mustChangePassword?: boolean;
			role?: string;
		};
	};
	nextUrl: {
		pathname: string;
	};
	url: string;
}

describe('proxy', () => {
	it('redirects when user must change password', () => {
		const req: MockNextRequest = {
			nextauth: { token: { mustChangePassword: true } },
			nextUrl: { pathname: '/something' },
			url: 'https://example.test/something',
		};

		const res = proxy(req);
		expect(res).toMatchObject({ redirected: true });
		expect(String(res.url)).toContain('/change-password');
	});

	it('blocks non-admin on admin-only paths', () => {
		const req: MockNextRequest = {
			nextauth: { token: { role: 'user' } },
			nextUrl: { pathname: '/api/people' },
			url: 'https://example.test/api/people',
		};

		const res = proxy(req);
		// The middleware returns a plain object with status 403 in that branch
		expect(res).toBeDefined();
		expect(res.status).toBe(403);
	});

	it('allows when authorized and not admin-only', () => {
		const req: MockNextRequest = {
			nextauth: { token: { role: 'user' } },
			nextUrl: { pathname: '/home' },
			url: 'https://example.test/home',
		};

		const res = proxy(req);
		expect(res).toMatchObject({ ok: true });
	});

	it('exports config matcher', () => {
		expect(config).toBeDefined();
		expect(Array.isArray(config.matcher)).toBe(true);
	});
});
