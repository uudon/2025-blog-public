/**
 * Analytics tracking API endpoint
 * Records page views and visitor data
 */

import { NextRequest, NextResponse } from 'next/server'
import { hashIp, isBot, extractReferrer } from '@/lib/analytics/utils'
import { addPageView, type PageView } from '@/lib/analytics/storage'

export const runtime = 'nodejs'

/**
 * POST /api/analytics/track
 * Records a page view
 *
 * Request body:
 * - slug: Article/page slug
 *
 * Headers extracted:
 * - CF-Connecting-IP: Visitor IP
 * - User-Agent: Browser user agent
 * - Referer: HTTP referrer
 * - CF-IPCountry: Country code (Cloudflare)
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { slug } = body

		if (!slug || typeof slug !== 'string') {
			return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
		}

		// Get visitor information
		const headers = request.headers
		const ip = headers.get('x-forwarded-for') || headers.get('x-real-ip') || '0.0.0.0'
		const userAgent = headers.get('user-agent') || ''
		const referrer = extractReferrer(headers, request.nextUrl.origin)
		const country = headers.get('cf-ipcountry') || undefined

		// Check if it's a bot
		const botCheck = isBot(userAgent)
		if (botCheck.isBot) {
			return NextResponse.json({
				success: true,
				skipped: true,
				reason: 'bot'
			})
		}

		// Hash IP for privacy
		const visitorId = await hashIp(ip)

		// Create page view record
		const pageView: PageView = {
			id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			slug,
			timestamp: new Date().toISOString(),
			visitorId,
			ip: ip.split(',')[0] || '0.0.0.0', // Take first IP if multiple
			referrer,
			userAgent,
			country
		}

		// Record page view
		await addPageView(pageView)

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Analytics tracking error:', error)
		return NextResponse.json(
			{ error: 'Failed to track', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		)
	}
}
