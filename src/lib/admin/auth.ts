import { NextRequest } from 'next/server'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

export function verifyPassword(password: string): boolean {
	return password === ADMIN_PASSWORD
}

export function extractPasswordFromRequest(request: NextRequest): string | null {
	// Check for password in query params
	const searchParams = request.nextUrl.searchParams
	const queryPassword = searchParams.get('password')
	if (queryPassword) {
		return queryPassword
	}

	// Check for password in Authorization header
	const authHeader = request.headers.get('authorization')
	if (authHeader && authHeader.startsWith('Bearer ')) {
		return authHeader.substring(7)
	}

	return null
}

export function isAuthenticated(request: NextRequest): boolean {
	const password = extractPasswordFromRequest(request)
	return password ? verifyPassword(password) : false
}
