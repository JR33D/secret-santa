import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
	function middleware(req) {
		const token = req.nextauth.token;
		const path = req.nextUrl.pathname;

		// If user must change password, redirect to change-password page
		if (token?.mustChangePassword && path !== '/change-password') {
			return NextResponse.redirect(new URL('/change-password', req.url));
		}

		// Admin-only routes
		const adminOnlyPaths = ['/api/people', '/api/pools', '/api/restrictions', '/api/generate', '/api/assignments', '/api/email-config', '/api/send-notifications', '/api/history-graph', '/api/users'];

		const isAdminOnlyPath = adminOnlyPaths.some((p) => path.startsWith(p));

		if (isAdminOnlyPath && token?.role !== 'admin') {
			return { status: 403, json: async () => ({ error: 'Unauthorized - Admin access required' }) } as any;
		}

		return NextResponse.next();
	},
	{
		callbacks: {
			authorized: ({ token }) => !!token,
		},
	},
);

export const config = {
	matcher: [
		/*
		 * Match all request paths except:
		 * - /login (login page)
		 * - /api/auth/* (auth endpoints)
		 * - /_next/* (Next.js internals)
		 * - /favicon.ico, /robots.txt (static files)
		 */
		'/((?!login|api/auth|_next|favicon.ico|robots.txt).*)',
	],
};
