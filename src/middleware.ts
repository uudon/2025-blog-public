import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PASSWORD_COOKIE_NAME = 'site_auth_token'

export function middleware(request: NextRequest) {
	const sitePassword = process.env.SITE_ACCESS_PASSWORD

	// If no password is set, allow access
	if (!sitePassword) {
		return NextResponse.next()
	}

	// Check if user is authenticated
	const authToken = request.cookies.get(PASSWORD_COOKIE_NAME)

	// If accessing auth page, allow it
	if (request.nextUrl.pathname === '/auth') {
		// If already authenticated, redirect to home
		if (authToken?.value === sitePassword) {
			return NextResponse.redirect(new URL('/', request.url))
		}
		return NextResponse.next()
	}

	// If not authenticated, redirect to auth page
	if (!authToken || authToken.value !== sitePassword) {
		const authUrl = new URL('/auth', request.url)
		return NextResponse.redirect(authUrl)
	}

	return NextResponse.next()
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except:
		 * - api routes (we need to access them for password verification)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder
		 */
		'/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
	]
}
