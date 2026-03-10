import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword } from '@/lib/admin/auth'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams
	const password = searchParams.get('password')

	if (!password) {
		return NextResponse.json({ valid: false, error: 'Password required' }, { status: 400 })
	}

	const isValid = verifyPassword(password)

	return NextResponse.json({ valid: isValid })
}
