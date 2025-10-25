import { apiGet, apiPost, apiDelete, apiPatch } from '@/lib/api';

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
				status: 500,
				json: async () => ({ error: 'Error message' }),
			});

			await expect(apiGet('/api/test')).rejects.toThrow('Error message');
		});

		it('should handle failed json parsing', async () => {
			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: false,
				status: 500,
				statusText: 'Internal Server Error',
				json: async () => {
					throw new Error('Invalid JSON');
				},
			});

			await expect(apiGet('/api/test')).rejects.toThrow('Internal Server Error');
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

		it('should throw error on failed post', async () => {
			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: false,
				status: 400,
				json: async () => ({ error: 'Bad request' }),
			});

			await expect(apiPost('/api/people', {})).rejects.toThrow('Bad request');
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

		it('should throw error on failed delete', async () => {
			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: false,
				status: 404,
				json: async () => ({ error: 'Not found' }),
			});

			await expect(apiDelete('/api/people/999')).rejects.toThrow('Not found');
		});
	});

	describe('apiPatch', () => {
		it('should patch successfully', async () => {
			const mockResponse = { success: true };
			const patchData = { name: 'Updated Name' };

			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await apiPatch('/api/pools/1', patchData);

			expect(global.fetch).toHaveBeenCalledWith('/api/pools/1', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(patchData),
			});
			expect(result).toEqual(mockResponse);
		});

		it('should throw error on failed patch', async () => {
			(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: false,
				status: 500,
				json: async () => ({ error: 'Server error' }),
			});

			await expect(apiPatch('/api/pools/1', {})).rejects.toThrow('Server error');
		});
	});
});
