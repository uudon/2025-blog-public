import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const PASSWORD_COOKIE_NAME = 'site_auth_token'
const PASSWORD_MAX_AGE = 24 * 60 * 60 // 1 day in seconds

export async function POST(request: NextRequest) {
	try {
		const { password } = await request.json()
		const sitePassword = process.env.SITE_ACCESS_PASSWORD

		if (!sitePassword) {
			return NextResponse.json(
				{ error: '网站未配置访问密码' },
				{ status: 500 }
			)
		}

		if (password === sitePassword) {
			const cookieStore = await cookies()
			cookieStore.set(PASSWORD_COOKIE_NAME, sitePassword, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				maxAge: PASSWORD_MAX_AGE,
				path: '/'
			})

			return NextResponse.json({ success: true })
		}

		return NextResponse.json({ error: '密码错误' }, { status: 401 })
	} catch {
		return NextResponse.json({ error: '验证失败' }, { status: 500 })
	}
}
