describe('auth nextauth route', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('calls NextAuth with authOptions and exports the handler as GET and POST', () => {
    const fakeHandler = () => new Response('ok');

    // Mock next-auth default export to capture the options passed and return our fake handler
    const nextAuthMock = jest.fn(() => fakeHandler);
    jest.doMock('next-auth', () => ({ __esModule: true, default: nextAuthMock }));

    // Provide a sentinel authOptions so we can assert it was forwarded
    const sentinelOptions = { secret: 'SENTINEL' };
    jest.doMock('@/lib/auth', () => ({ authOptions: sentinelOptions }));

    // Load the route module after mocks are in place
    const route = require('@/app/api/auth/[...nextauth]/route');

    expect(nextAuthMock).toHaveBeenCalledWith(sentinelOptions);
    expect(route.GET).toBe(fakeHandler);
    expect(route.POST).toBe(fakeHandler);
  });
});
