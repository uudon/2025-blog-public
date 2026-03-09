/**
 * Analytics top articles API endpoint
 * Returns top articles by views
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

/**
 * GET /api/analytics/top
 * Returns top articles by views
 *
 * Query params:
 * - days: Number of days to include (default: 30)
 * - limit: Number of articles to return (default: 10)
 */
export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams
		const days = parseInt(searchParams.get('days') || '30', 10)
		const limit = parseInt(searchParams.get('limit') || '10', 10)

		const startDate = new Date()
		startDate.setDate(startDate.getDate() - days)

		const topArticles = await prisma.pageView.groupBy({
			by: ['slug'],
			where: {
				timestamp: {
					gte: startDate
				}
			},
			_count: {
				views: true
			},
			orderBy: {
				views: 'desc'
			},
			take: limit
		})

		return NextResponse.json({
			articles: topArticles.map((a) => ({
				slug: a.slug,
				views: a._count.views,
				visitors: a._count.visitors || 0
			}))
		})
	} catch (error) {
		console.error('Analytics top articles error:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch top articles', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		)
	}
}
