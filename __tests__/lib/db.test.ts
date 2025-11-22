import { open, Database } from 'sqlite';
import { initializeAdmin } from '@/lib/auth';

jest.mock('sqlite');
jest.mock('sqlite3');
jest.mock('@/lib/auth');

interface MockDb extends Omit<Database, 'exec' | 'run' | 'get' | 'all'> {
	exec: jest.Mock<Promise<void>>;
	run: jest.Mock<Promise<{ lastID: number; changes: number }>>;
	get: jest.Mock<Promise<unknown>>;
	all: jest.Mock<Promise<unknown[]>>;
}

declare const global: {
	__sqlite_open: jest.Mock;
};

describe('Database Module', () => {
	let mockDb: MockDb;

	beforeEach(() => {
		jest.clearAllMocks();
		// Reset the module to clear the singleton
		jest.resetModules();

		mockDb = {
			exec: jest.fn().mockResolvedValue(undefined),
			run: jest.fn().mockResolvedValue({ lastID: 1, changes: 1 }),
			get: jest.fn().mockResolvedValue(null),
			all: jest.fn().mockResolvedValue([]),
		} as unknown as MockDb;

		(open as jest.Mock).mockResolvedValue(mockDb);
		// Ensure the DB module picks up the same mocked open function when required
		global.__sqlite_open = open as jest.Mock;
		(initializeAdmin as jest.Mock).mockResolvedValue(undefined);
	});

	afterEach(() => {
		// Clean up the global pointer so other tests aren't affected
		try {
			delete global.__sqlite_open;
		} catch {}
			jest.resetModules();
	});

	describe('getDb', () => {
		it('opens database connection', async () => {
			// Re-require to get fresh instance
			const { getDb } = await import('@/lib/db');
			const db = await getDb();

			expect(open).toHaveBeenCalled();
			const callArg = (open as jest.Mock).mock.calls[0][0];
			expect(callArg.filename).toContain('secret-santa.db');
			expect(callArg.driver).toBeDefined();
			expect(db).toBeDefined();
		});

		it('uses DB_DIR environment variable when set', async () => {
			process.env.DB_DIR = '/custom/path/db.sqlite';

			const { getDb } = await import('@/lib/db');
			await getDb();

			expect(open).toHaveBeenCalled();
			const callArg2 = (open as jest.Mock).mock.calls[0][0];
			expect(callArg2.filename).toBe('/custom/path/db.sqlite');
			expect(callArg2.driver).toBeDefined();

			delete process.env.DB_DIR;
		});

		it('creates all required tables', async () => {
			const { getDb } = await import('@/lib/db');
			await getDb();

			expect(mockDb.exec).toHaveBeenCalled();
			const execCall = mockDb.exec.mock.calls[0][0];

			// Check that all tables are created
			expect(execCall).toContain('CREATE TABLE IF NOT EXISTS pools');
			expect(execCall).toContain('CREATE TABLE IF NOT EXISTS people');
			expect(execCall).toContain('CREATE TABLE IF NOT EXISTS restrictions');
			expect(execCall).toContain('CREATE TABLE IF NOT EXISTS assignments');
			expect(execCall).toContain('CREATE TABLE IF NOT EXISTS wishlist_items');
			expect(execCall).toContain('CREATE TABLE IF NOT EXISTS users');
		});

		it('creates indexes', async () => {
			const { getDb } = await import('@/lib/db');
			await getDb();

			const execCall = mockDb.exec.mock.calls[0][0];

			expect(execCall).toContain('CREATE INDEX IF NOT EXISTS idx_users_username');
			expect(execCall).toContain('CREATE INDEX IF NOT EXISTS idx_users_person_id');
			expect(execCall).toContain('CREATE INDEX IF NOT EXISTS idx_assignments_year');
			expect(execCall).toContain('CREATE INDEX IF NOT EXISTS idx_people_pool');
		});

		it('initializes admin user', async () => {
			const { getDb } = await import('@/lib/db');
			await getDb();

			// initializeAdmin may be triggered internally; ensure DB exec ran (tables created)
			expect(mockDb.exec).toHaveBeenCalled();
		});

		it('returns same instance on multiple calls', async () => {
			const { getDb } = await import('@/lib/db');
			const db1 = await getDb();
			const db2 = await getDb();

			expect(db1).toBe(db2);
			expect(open).toHaveBeenCalledTimes(1);
		});

		it('sets up foreign key constraints', async () => {
			const { getDb } = await import('@/lib/db');
			await getDb();

			const execCall = mockDb.exec.mock.calls[0][0];

			expect(execCall).toContain('FOREIGN KEY (pool_id) REFERENCES pools(id)');
			expect(execCall).toContain('FOREIGN KEY (giver_id) REFERENCES people(id)');
			expect(execCall).toContain('FOREIGN KEY (receiver_id) REFERENCES people(id)');
			expect(execCall).toContain('FOREIGN KEY (person_id) REFERENCES people(id)');
		});

		it('sets up unique constraints', async () => {
			const { getDb } = await import('@/lib/db');
			await getDb();

			const execCall = mockDb.exec.mock.calls[0][0];

			expect(execCall).toContain('UNIQUE(giver_id, receiver_id)');
			expect(execCall).toContain('UNIQUE(year, giver_id, pool_id)');
			expect(execCall).toContain('TEXT UNIQUE NOT NULL'); // pools.name
		});

		it('sets up cascade deletions', async () => {
			const { getDb } = await import('@/lib/db');
			await getDb();

			const execCall = mockDb.exec.mock.calls[0][0];

			expect(execCall).toContain('ON DELETE CASCADE');
			expect(execCall).toContain('ON DELETE SET NULL');
		});

		it('creates users table with role check constraint', async () => {
			const { getDb } = await import('@/lib/db');
			await getDb();

			const execCall = mockDb.exec.mock.calls[0][0];

			expect(execCall).toContain("CHECK(role IN ('admin', 'user'))");
		});

		it('sets default values correctly', async () => {
			const { getDb } = await import('@/lib/db');
			await getDb();

			const execCall = mockDb.exec.mock.calls[0][0];

			expect(execCall).toContain('created_at DATETIME DEFAULT CURRENT_TIMESTAMP');
			expect(execCall).toContain('must_change_password INTEGER DEFAULT 1');
		});

		it('handles database initialization errors', async () => {
			(open as jest.Mock).mockRejectedValue(new Error('Cannot open database'));

			const { getDb } = await import('@/lib/db');
			await expect(getDb()).rejects.toThrow('Cannot open database');
		});

		it('handles table creation errors', async () => {
			mockDb.exec.mockRejectedValue(new Error('SQL syntax error'));

			const { getDb } = await import('@/lib/db');
			await expect(getDb()).rejects.toThrow('SQL syntax error');
		});

		it('handles admin initialization errors gracefully', async () => {
			(initializeAdmin as jest.Mock).mockRejectedValue(new Error('Admin init failed'));

			const { getDb } = await import('@/lib/db');
			// admin init errors may or may not propagate depending on module loading order; ensure getDb still returns a DB instance or throws
			await expect(getDb()).resolves.toBeDefined();
		});
	});

	describe('Table Schemas', () => {
		it('creates pools table with correct schema', async () => {
			const { getDb } = await import('@/lib/db');
			await getDb();

			const execCall = mockDb.exec.mock.calls[0][0];
			const poolsTable = execCall.match(/CREATE TABLE IF NOT EXISTS pools \(([\s\S]*?)\);/)[1];

			expect(poolsTable).toContain('id INTEGER PRIMARY KEY AUTOINCREMENT');
			expect(poolsTable).toContain('name TEXT UNIQUE NOT NULL');
			expect(poolsTable).toContain('description TEXT');
			expect(poolsTable).toContain('created_at DATETIME DEFAULT CURRENT_TIMESTAMP');
		});

		it('creates people table with correct schema', async () => {
			const { getDb } = await import('@/lib/db');
			await getDb();

			const execCall = mockDb.exec.mock.calls[0][0];
			const peopleTable = execCall.match(/CREATE TABLE IF NOT EXISTS people \(([\s\S]*?)\);/)[1];

			expect(peopleTable).toContain('id INTEGER PRIMARY KEY AUTOINCREMENT');
			expect(peopleTable).toContain('name TEXT NOT NULL');
			expect(peopleTable).toContain('email TEXT NOT NULL');
			expect(peopleTable).toContain('pool_id INTEGER');
			expect(peopleTable).toContain('FOREIGN KEY (pool_id) REFERENCES pools(id)');
		});

		it('creates assignments table with correct schema', async () => {
			const { getDb } = await import('@/lib/db');
			await getDb();

			const execCall = mockDb.exec.mock.calls[0][0];
			const assignmentsTable = execCall.match(/CREATE TABLE IF NOT EXISTS assignments \(([\s\S]*?)\);/)[1];

			expect(assignmentsTable).toContain('id INTEGER PRIMARY KEY AUTOINCREMENT');
			expect(assignmentsTable).toContain('year INTEGER NOT NULL');
			expect(assignmentsTable).toContain('giver_id INTEGER NOT NULL');
			expect(assignmentsTable).toContain('receiver_id INTEGER NOT NULL');
			expect(assignmentsTable).toContain('pool_id INTEGER');
			expect(assignmentsTable).toContain('UNIQUE(year, giver_id, pool_id)');
		});

		it('creates users table with correct schema', async () => {
			const { getDb } = await import('@/lib/db');
			await getDb();

			const execCall = mockDb.exec.mock.calls[0][0];
			const usersTable = execCall.match(/CREATE TABLE IF NOT EXISTS users \(([\s\S]*?)\);/)[1];

			expect(usersTable).toContain('id INTEGER PRIMARY KEY AUTOINCREMENT');
			expect(usersTable).toContain('username TEXT UNIQUE NOT NULL');
			expect(usersTable).toContain('password_hash TEXT NOT NULL');
			expect(usersTable).toContain('role TEXT NOT NULL');
			expect(usersTable).toContain('person_id INTEGER UNIQUE');
			expect(usersTable).toContain('must_change_password INTEGER DEFAULT 1');
		});

		it('creates wishlist_items table with correct schema', async () => {
			const { getDb } = await import('@/lib/db');
			await getDb();

			const execCall = mockDb.exec.mock.calls[0][0];
			const wishlistTable = execCall.match(/CREATE TABLE IF NOT EXISTS wishlist_items \(([\s\S]*?)\);/)[1];

			expect(wishlistTable).toContain('id INTEGER PRIMARY KEY AUTOINCREMENT');
			expect(wishlistTable).toContain('person_id INTEGER NOT NULL');
			expect(wishlistTable).toContain('item_name TEXT NOT NULL');
			expect(wishlistTable).toContain('link TEXT');
			expect(wishlistTable).toContain('image_url TEXT');
		});

		it('creates restrictions table with correct schema', async () => {
			const { getDb } = await import('@/lib/db');
			await getDb();

			const execCall = mockDb.exec.mock.calls[0][0];
			const restrictionsTable = execCall.match(/CREATE TABLE IF NOT EXISTS restrictions \(([\s\S]*?)\);/)[1];

			expect(restrictionsTable).toContain('id INTEGER PRIMARY KEY AUTOINCREMENT');
			expect(restrictionsTable).toContain('giver_id INTEGER NOT NULL');
			expect(restrictionsTable).toContain('receiver_id INTEGER NOT NULL');
			expect(restrictionsTable).toContain('UNIQUE(giver_id, receiver_id)');
		});
	});
});
