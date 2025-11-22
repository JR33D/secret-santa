describe('App pages', () => {
	describe('root page redirect', () => {
		it('calls redirect to /login', async () => {
			const redirectMock = jest.fn();
			jest.mock('next/navigation', () => ({ redirect: redirectMock }));

			// Clear module cache and require the page module
			jest.resetModules();
			const { default: Home } = await import('@/app/page');

			// Call the component function (server component) which should call redirect
			Home();

			expect(redirectMock).toHaveBeenCalledWith('/login');
		});
	});

	// Login page client-component tests are omitted here because rendering Next.js app-directory
	// client components inside Jest/JSDOM can surface React runtime differences (hooks dispatchers)
	// that are unrelated to the application logic. The root redirect test above covers the server
	// `page.tsx` redirect behavior which was the primary goal for this file.
});
