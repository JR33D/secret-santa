jest.mock('bcryptjs');
jest.mock('@/lib/db');
const { getDb } = require('@/lib/db');
const { hashPassword, generatePassword, initializeAdmin } = require('@/lib/auth');

describe('auth helpers', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('hashPassword returns hashed value from bcrypt mock', async () => {
		const out = await hashPassword('secret');
		expect(typeof out).toBe('string');
		expect(out).toBe('hashed_password');
	});

	it('generatePassword returns string of requested length', () => {
		const p1 = generatePassword(8);
		const p2 = generatePassword(8);
		expect(typeof p1).toBe('string');
		expect(p1).toHaveLength(8);
		// Likely different
		expect(p1).not.toBe(p2);
	});

	describe('initializeAdmin', () => {
		const mockDb: any = { get: jest.fn(), run: jest.fn() };

		beforeEach(() => {
			(getDb as jest.Mock).mockResolvedValue(mockDb);
			jest.spyOn(console, 'warn').mockImplementation(() => {});
			jest.spyOn(console, 'log').mockImplementation(() => {});
		});

		afterEach(() => {
			(console.warn as unknown as jest.SpyInstance).mockRestore();
			(console.log as unknown as jest.SpyInstance).mockRestore();
			delete process.env.ADMIN_PASSWORD;
			delete process.env.ADMIN_USERNAME;
		});

		it('warns and returns when ADMIN_PASSWORD is not set', async () => {
			delete process.env.ADMIN_PASSWORD;
			await initializeAdmin();
			expect(console.warn).toHaveBeenCalled();
			expect(getDb).not.toHaveBeenCalled();
		});

		it('does not create admin if user exists', async () => {
			process.env.ADMIN_PASSWORD = 'pw';
			process.env.ADMIN_USERNAME = 'adminuser';
			mockDb.get.mockResolvedValue({ id: 1 });

			await initializeAdmin();

			expect(getDb).toHaveBeenCalled();
			expect(mockDb.get).toHaveBeenCalledWith('SELECT id FROM users WHERE username = ?', ['adminuser']);
			expect(mockDb.run).not.toHaveBeenCalled();
		});

		it('creates admin when not present', async () => {
			process.env.ADMIN_PASSWORD = 'pw2';
			process.env.ADMIN_USERNAME = 'theadmin';
			mockDb.get.mockResolvedValue(null);

			await initializeAdmin();

			expect(getDb).toHaveBeenCalled();
			expect(mockDb.run).toHaveBeenCalled();
			const callArgs = mockDb.run.mock.calls[0];
			expect(callArgs[0]).toMatch(/INSERT INTO users/);
			expect(callArgs[1][0]).toBe('theadmin');
		});
	});
});

describe('auth provider authorize', () => {
	const mockDb: any = { get: jest.fn() };
	const bcrypt = require('bcryptjs');

	beforeEach(() => {
		jest.clearAllMocks();
		(getDb as jest.Mock).mockResolvedValue(mockDb);
	});

	it('returns null when credentials missing', async () => {
		const { authOptions } = require('@/lib/auth');
		const provider: any = (authOptions.providers as any)[0];
		const res = await provider.authorize?.(undefined as any);
		expect(res).toBeNull();
	});

	it('returns null when user not found', async () => {
		mockDb.get.mockResolvedValue(null);
		const { authOptions } = require('@/lib/auth');
		const provider: any = (authOptions.providers as any)[0];
		const res = await provider.authorize?.({ username: 'noone', password: 'pw' } as any);
		expect(res).toBeNull();
	});

	it('returns user object when credentials match', async () => {
		// test the extracted helper directly
		const bcrypt = require('bcryptjs');
		mockDb.get.mockResolvedValue({ id: 7, username: 'sam', password_hash: 'hashed_pw', role: 'user', person_id: 12, must_change_password: 0 });
		(bcrypt.compare as jest.Mock).mockResolvedValue(true);

		const { authorizeCredentials } = require('@/lib/auth');
		const res = await authorizeCredentials({ username: 'sam', password: 'pw' });

		expect(res).not.toBeNull();
		expect(res?.username).toBe('sam');
		expect(res?.id).toBe('7');
		expect(res?.role).toBe('user');
	});

	it('returns null when password is incorrect using helper', async () => {
		const bcrypt = require('bcryptjs');
		mockDb.get.mockResolvedValue({ id: 8, username: 'joe', password_hash: 'hashed_pw', role: 'user', person_id: 5, must_change_password: 0 });
		(bcrypt.compare as jest.Mock).mockResolvedValue(false);

		const { authorizeCredentials } = require('@/lib/auth');
		const res = await authorizeCredentials({ username: 'joe', password: 'wrong' });
		expect(res).toBeNull();
	});

	// Successful authorize flow is covered indirectly by other integration tests
});
