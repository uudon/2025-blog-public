/**
 * Analytics top articles API endpoint
 * Returns top articles by views
 */

import { NextRequest, NextResponse } from 'next/server'
import { getViewsByDateRange } from '@/lib/analytics/storage'

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
		startDate.setHours(0, 0, 0, 0)

		const endDate = new Date()
		endDate.setHours(23, 59, 59, 999)

		// Get all views in date range
		const views = await getViewsByDateRange(startDate, endDate)

		// Group by slug and count views
		const articleStats = new Map<string, { views: number; visitors: Set<string> }>()

		views.forEach((view) => {
			if (!articleStats.has(view.slug)) {
				articleStats.set(view.slug, { views: 0, visitors: new Set() })
			}
			const stat = articleStats.get(view.slug)!
			stat.views++
			stat.visitors.add(view.visitorId)
		})

		// Convert to array and sort by views
		const topArticles = Array.from(articleStats.entries())
			.map(([slug, stats]) => ({
				slug,
				views: stats.views,
				visitors: stats.visitors.size
			}))
			.sort((a, b) => b.views - a.views)
			.slice(0, limit)

		return NextResponse.json({
			articles: topArticles
		})
	} catch (error) {
		console.error('Analytics top articles error:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch top articles', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		)
	}
}
