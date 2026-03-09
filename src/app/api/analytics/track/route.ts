/**
 * Analytics tracking API endpoint
 * Records page views and visitor data
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashIp, isBot, extractCountry, extractReferrer } from '@/lib/analytics/utils'

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
		const country = extractCountry(headers)

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

		// Record page view
		await prisma.pageView.create({
			data: {
				slug,
				timestamp: new Date(),
				visitorId,
				referrer,
				userAgent,
				country
			}
		})

		// Update daily stats
		const today = new Date()
		today.setHours(0, 0, 0, 0)

		await prisma.dailyStats.upsert({
			where: {
				slug_date: {
					slug,
					date: today
				}
			},
			create: {
				data: {
					slug,
					date: today,
					pageViews: 1,
					uniqueVisitors: 1
				}
			},
			update: {
				data: {
					pageViews: {
						increment: 1
					},
					uniqueVisitors: {
						increment: 1
					}
				}
			}
		})

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Analytics tracking error:', error)
		return NextResponse.json(
			{ error: 'Failed to track', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		)
	}
}
