import { getEnvEmailConfig, isEmailConfigValid } from '@/lib/email-config';

describe('Email Config helpers', () => {
	const OLD_ENV = process.env;

	beforeEach(() => {
		jest.resetModules(); // clear cached env reads
		process.env = { ...OLD_ENV };
	});

	afterEach(() => {
		process.env = OLD_ENV;
	});

	it('returns null when SMTP_SERVER is not set', () => {
		delete process.env.SMTP_SERVER;
		const cfg = getEnvEmailConfig();
		expect(cfg).toBeNull();
	});

	it('parses environment variables and defaults port to 587', () => {
		process.env.SMTP_SERVER = 'smtp.example.com';
		delete process.env.SMTP_PORT;
		process.env.SMTP_USERNAME = 'user';
		process.env.SMTP_PASSWORD = 'pass';
		process.env.FROM_EMAIL = 'noreply@example.com';

		const cfg = getEnvEmailConfig();
		expect(cfg).not.toBeNull();
		expect(cfg!.smtp_server).toBe('smtp.example.com');
		expect(cfg!.smtp_port).toBe(587);
		expect(cfg!.smtp_username).toBe('user');
		expect(cfg!.from_email).toBe('noreply@example.com');
	});

	it('validates minimal email config correctly', () => {
		expect(isEmailConfigValid(null)).toBe(false);

		const missingFrom = { smtp_server: 'smtp.example.com', smtp_port: 25 } as any;
		expect(isEmailConfigValid(missingFrom)).toBe(false);

		const missingServer = { smtp_port: 25, from_email: 'noreply@example.com' } as any;
		expect(isEmailConfigValid(missingServer)).toBe(false);

		const good = { smtp_server: 'smtp', smtp_port: 25, from_email: 'noreply@example.com' } as any;
		expect(isEmailConfigValid(good)).toBe(true);
	});

	it('parses explicit SMTP_PORT and returns null for absent optional fields', () => {
		process.env.SMTP_SERVER = 'smtp.example.com';
		process.env.SMTP_PORT = '2525';
		delete process.env.SMTP_USERNAME;
		delete process.env.SMTP_PASSWORD;
		delete process.env.FROM_EMAIL;

		const cfg = getEnvEmailConfig();
		expect(cfg).not.toBeNull();
		expect(cfg!.smtp_port).toBe(2525);
		expect(cfg!.smtp_username).toBeNull();
		expect(cfg!.smtp_password).toBeNull();
		expect(cfg!.from_email).toBeNull();
		// Missing from_email should make the config invalid
		expect(isEmailConfigValid(cfg)).toBe(false);
	});
});
