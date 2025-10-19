import { apiGet, apiPost, apiDelete } from '@/lib/api';

describe('API Helper Functions', () => {
	beforeEach(() => {
		global.fetch = jest.fn();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('apiGet', () => {
		it('should fetch data successfully', async () => {
			const mockData = { id: 1, name: 'Test' };
			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => mockData,
			});

			const result = await apiGet('/api/test');

			expect(global.fetch).toHaveBeenCalledWith('/api/test');
			expect(result).toEqual(mockData);
		});

		it('should throw error on failed request', async () => {
			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: false,
				text: async () => 'Error message',
			});

			await expect(apiGet('/api/test')).rejects.toThrow('Error message');
		});
	});

	describe('apiPost', () => {
		it('should post data successfully', async () => {
			const mockResponse = { success: true };
			const postData = { name: 'John', email: 'john@example.com' };

			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await apiPost('/api/people', postData);

			expect(global.fetch).toHaveBeenCalledWith('/api/people', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(postData),
			});
			expect(result).toEqual(mockResponse);
		});

		it('should handle post without body', async () => {
			const mockResponse = { success: true };

			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			await apiPost('/api/action');

			expect(global.fetch).toHaveBeenCalledWith('/api/action', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: undefined,
			});
		});
	});

	describe('apiDelete', () => {
		it('should delete successfully', async () => {
			const mockResponse = { success: true };

			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await apiDelete('/api/people/1');

			expect(global.fetch).toHaveBeenCalledWith('/api/people/1', {
				method: 'DELETE',
			});
			expect(result).toEqual(mockResponse);
		});
	});
});
