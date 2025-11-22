/**
 * @jest-environment node
 */
import { NextFetchEvent } from 'next/server';

// Mock next-auth/middleware to return the inner function
jest.mock('next-auth/middleware', () => ({
	withAuth: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
}));

jest.mock('next/server', () => ({
	NextResponse: {
		redirect: (u: URL) => ({ redirected: true, url: u.toString() }),
		next: () => ({ ok: true }),
		json: <T = unknown>(body: T, init: { status?: number } = {}) => ({
			...((body as object) || {}),
			status: init.status ?? 200,
			json: async () => body,
		}),
	},
}));

import proxy, { config } from '@/lib/proxy';

interface MockToken {
	mustChangePassword?: boolean;
	role?: string;
}

interface MockNextUrl {
	pathname: string;
}

interface MockRequest {
	nextauth: {
		token: MockToken;
	};
	nextUrl: MockNextUrl;
	url: string;
}

// Create a mock NextFetchEvent
const mockEvent = {} as NextFetchEvent;

describe('proxy', () => {
	it('redirects when user must change password', () => {
		const req = {
			nextauth: { token: { mustChangePassword: true } },
			nextUrl: { pathname: '/something' },
			url: 'https://example.test/something',
		} as MockRequest;

		const res = proxy(req as Parameters<typeof proxy>[0], mockEvent);
		expect(res).toMatchObject({ redirected: true });
		expect(String((res as { url: string }).url)).toContain('/change-password');
	});

	it('blocks non-admin on admin-only paths', () => {
		const req = {
			nextauth: { token: { role: 'user' } },
			nextUrl: { pathname: '/api/people' },
			url: 'https://example.test/api/people',
		} as MockRequest;

		const res = proxy(req as Parameters<typeof proxy>[0], mockEvent);
		expect(res).toBeDefined();
		expect((res as { status: number }).status).toBe(403);
	});

	it('allows when authorized and not admin-only', () => {
		const req = {
			nextauth: { token: { role: 'user' } },
			nextUrl: { pathname: '/home' },
			url: 'https://example.test/home',
		} as MockRequest;

		const res = proxy(req as Parameters<typeof proxy>[0], mockEvent);
		expect(res).toMatchObject({ ok: true });
	});

	it('exports config matcher', () => {
		expect(config).toBeDefined();
		expect(Array.isArray(config.matcher)).toBe(true);
	});
});
