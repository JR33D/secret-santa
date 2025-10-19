// Import Jest DOM matchers
import '@testing-library/jest-dom';

// Mock window.matchMedia (not available in jsdom)
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: jest.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: jest.fn(), // Deprecated
		removeListener: jest.fn(), // Deprecated
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
		dispatchEvent: jest.fn(),
	})),
});

// Mock IntersectionObserver (not available in jsdom)
global.IntersectionObserver = class IntersectionObserver {
	constructor() {}
	disconnect() {}
	observe() {}
	takeRecords() {
		return [];
	}
	unobserve() {}
};

// Mock ResizeObserver (not available in jsdom)
global.ResizeObserver = class ResizeObserver {
	constructor() {}
	disconnect() {}
	observe() {}
	unobserve() {}
};

// Mock fetch globally
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests (optional)
global.console = {
	...console,
	// Uncomment to suppress console outputs during tests
	// log: jest.fn(),
	// debug: jest.fn(),
	// info: jest.fn(),
	// warn: jest.fn(),
	// error: jest.fn(),
};

// Mock HTMLCanvasElement methods (used in HistoryTab)
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
	arc: jest.fn(),
	stroke: jest.fn(),
	fill: jest.fn(),
	measureText: jest.fn(() => ({ width: 0 })),
}));

// Mock window.alert and window.confirm
global.alert = jest.fn();
global.confirm = jest.fn();

// Reset all mocks between tests
beforeEach(() => {
	jest.clearAllMocks();
});

// Clean up after each test
afterEach(() => {
	jest.restoreAllMocks();
});
