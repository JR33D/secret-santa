import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
	async function middleware(req) {
		const { pathname } = req.nextUrl;
		const token = req.nextauth.token;

		// Redirect unauthenticated users from protected routes
		if (!token && !pathname.startsWith('/login')) {
			return NextResponse.redirect(new URL('/login', req.url));
		}

		// If authenticated, check for admin role on admin-only routes
		if (token && token.role !== 'admin' && (
			pathname.startsWith('/pools') ||
			pathname.startsWith('/people') ||
			pathname.startsWith('/users') ||
			pathname.startsWith('/wishlist') || // Admin view of wishlists
			pathname.startsWith('/restrictions') ||
			pathname.startsWith('/generate') ||
			pathname.startsWith('/history') ||
			pathname.startsWith('/email')
		)) {
			// Redirect non-admin users from admin pages to their default page
			return NextResponse.redirect(new URL('/my-wishlist', req.url));
		}

		// Allow access to other authenticated routes
		return NextResponse.next();
	},
	{
		callbacks: {
			authorized: ({ token, req }) => {
				const { pathname } = req.nextUrl;

				// Allow access to login page for everyone
				if (pathname.startsWith('/login')) {
					return true;
				}

				// Allow access to API routes for authenticated users
				if (pathname.startsWith('/api')) {
					return !!token;
				}

				// All other routes require authentication
				return !!token;
			},
		},
	}
);

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public assets (e.g. /images)
		 * - api routes (handled separately in authorized callback)
		 * - login page (handled separately in authorized callback)
		 */
		'/((?!_next/static|_next/image|favicon.ico|images|api|login).*)',
	],
};
