// jest.setup.ts
import '@testing-library/jest-dom';

// -----------------------------
// Node polyfills (TextEncoder/TextDecoder, fetch)
import { TextEncoder, TextDecoder } from 'util';

if (typeof globalThis.TextEncoder === 'undefined') {
	(globalThis as unknown as { TextEncoder: typeof TextEncoder }).TextEncoder = TextEncoder;
}
if (typeof globalThis.TextDecoder === 'undefined') {
	(globalThis as unknown as { TextDecoder: typeof TextDecoder }).TextDecoder = TextDecoder;
}

// Undici fetch polyfill for Node (Next.js App Router)
if (typeof window === 'undefined') {
	(async () => {
		const { fetch, Request, Response, Headers } = await import('undici');
		// @ts-expect-error Polyfill global fetch for Node
		globalThis.fetch = fetch;
		// @ts-expect-error Polyfill global Request for Node
		globalThis.Request = Request;
		// @ts-expect-error Polyfill global Response for Node
		globalThis.Response = Response;
		// @ts-expect-error Polyfill global Headers for Node
		globalThis.Headers = Headers;
	})();
}

// -----------------------------
// Browser-only mocks
if (typeof window !== 'undefined') {
	// IntersectionObserver
	class MockIntersectionObserver {
		disconnect() {}
		observe() {}
		unobserve() {}
		takeRecords(): unknown[] {
			return [];
		}
	}
	(globalThis as unknown as { IntersectionObserver?: typeof MockIntersectionObserver }).IntersectionObserver = MockIntersectionObserver;

	// matchMedia
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: jest.fn().mockImplementation((query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: jest.fn(),
			removeListener: jest.fn(),
			addEventListener: jest.fn(),
			removeEventListener: jest.fn(),
			dispatchEvent: jest.fn(),
		})),
	});
}

// -----------------------------
// next-auth mocks (works in Node and jsdom)
jest.mock('next-auth', () => ({
	getServerSession: jest.fn().mockResolvedValue(null),
}));
jest.mock('next-auth/react', () => ({
	useSession: jest.fn().mockReturnValue({ data: null }),
	signIn: jest.fn(),
	signOut: jest.fn(),
}));

// -----------------------------
// bcryptjs mocks
jest.mock('bcryptjs', () => ({
	compare: jest.fn(),
	hash: jest.fn().mockResolvedValue('hashed_password'),
}));

// -----------------------------
// SQLite dynamic import for Node
(async () => {
	try {
		const sqlite = await import('sqlite');
		(globalThis as unknown as { __sqlite_open?: unknown }).__sqlite_open = sqlite.open ?? sqlite.default?.open ?? sqlite;
	} catch {
		// ignore if sqlite not available
	}
})();
