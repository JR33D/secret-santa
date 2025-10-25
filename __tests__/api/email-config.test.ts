import { GET, POST } from '@/app/api/email-config/route';

describe('Email API Route (env-only)', () => {
	afterEach(() => {
		jest.resetAllMocks();
		delete process.env.SMTP_SERVER;
		delete process.env.SMTP_PORT;
		delete process.env.SMTP_USERNAME;
		delete process.env.FROM_EMAIL;
	});

	describe('GET', () => {
		it('should return env-based email config when set', async () => {
			process.env.SMTP_SERVER = 'smtp.example.com';
			process.env.SMTP_PORT = '587';
			process.env.SMTP_USERNAME = 'user';
			process.env.FROM_EMAIL = 'test@example.com';

			const response = await GET();
			const json = await response.json();

			expect(json.smtp_server).toBe('smtp.example.com');
			expect(json.smtp_port).toBe(587);
			expect(json.smtp_username).toBe('user');
			expect(json.from_email).toBe('test@example.com');
			expect(json.source).toBe('env');
		});

		it('should return empty object when no env config', async () => {
			const response = await GET();
			const json = await response.json();

			expect(json).toEqual({});
		});
	});

	describe('POST', () => {
		it('should reject POST with 403 in env-only mode', async () => {
			const response = await POST();
			const json = await response.json();

			expect(response.status).toBe(403);
			expect(json).toHaveProperty('error');
		});
	});
});
