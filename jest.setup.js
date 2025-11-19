// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import 'whatwg-fetch';

// Node-like polyfills for route tests
if (typeof global.Request === 'undefined') {
	const { Request, Response, Headers, fetch } = require('node-fetch');
	Object.assign(global, { Request, Response, Headers, fetch });
}
// Mock Next.js Request/Response for API route tests
global.Request = class Request {
	constructor(input, init) {
		this.url = input;
		this.method = init?.method || 'GET';
		this.headers = new Map(Object.entries(init?.headers || {}));
		this.body = init?.body;
	}
};

global.Response = class Response {
	constructor(body, init) {
		this.body = body;
		this.status = init?.status || 200;
		this.headers = new Map(Object.entries(init?.headers || {}));
		this.json = async () => JSON.parse(this.body);
	}
};

// Add a static helper similar to NextResponse.json / Edge Response.json used in Next runtime
global.Response.json = function (data, init) {
	return new global.Response(JSON.stringify(data), init || {});
};

jest.mock('next/server', () => ({
	NextRequest: class NextRequest {
		constructor(input, init) {
			this.url = input;
			this.method = init?.method || 'GET';
			this.headers = new Map(Object.entries(init?.headers || {}));
			this.body = init?.body;
		}
	},
}));

// Mock next-auth to avoid pulling in ESM-only dependencies during tests
jest.mock('next-auth', () => ({
	getServerSession: jest.fn().mockResolvedValue(null),
}));

jest.mock('next-auth/react', () => ({
	useSession: jest.fn().mockReturnValue({ data: null }),
	signIn: jest.fn(),
	signOut: jest.fn(),
}));

// Provide a sensible default mock for bcryptjs so hash() returns a string in tests
jest.mock('bcryptjs', () => ({
	compare: jest.fn(),
	hash: jest.fn().mockResolvedValue('hashed_password'),
}));

// Expose sqlite.open to the global test environment so modules that require/import
// sqlite dynamically can pick up the mocked open function reliably.
try {
	// eslint-disable-next-line global-require
	const sqlite = require('sqlite');
	// handle different shapes
	global.__sqlite_open = sqlite.open ?? sqlite.default?.open ?? sqlite;
} catch (e) {
	// ignore if sqlite isn't available at setup time
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: jest.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: jest.fn(), // deprecated
		removeListener: jest.fn(), // deprecated
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
		dispatchEvent: jest.fn(),
	})),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
	constructor() {}
	disconnect() {}
	observe() {}
	takeRecords() {
		return [];
	}
	unobserve() {}
};

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
	fillStyle: '',
	strokeStyle: '',
	lineWidth: 0,
	font: '',
	textAlign: '',
	textBaseline: '',
	clearRect: jest.fn(),
	fillRect: jest.fn(),
	fillText: jest.fn(),
	beginPath: jest.fn(),
	moveTo: jest.fn(),
	lineTo: jest.fn(),
	stroke: jest.fn(),
	arc: jest.fn(),
	fill: jest.fn(),
}));

// Suppress console errors during tests (optional)
// Uncomment if you want cleaner test output
// global.console = {
//   ...console,
//   error: jest.fn(),
//   warn: jest.fn(),
// };
