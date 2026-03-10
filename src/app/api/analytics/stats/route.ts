/**
 * Analytics stats API endpoint
 * Returns analytics data for articles
 */

import { NextRequest, NextResponse } from 'next/server'
import { readAnalyticsData, getViewsByDateRange } from '@/lib/analytics/storage'

export const runtime = 'nodejs'

interface DailyStat {
	date: string
	views: number
	visitors: number
}

/**
 * GET /api/analytics/stats
 * Returns analytics data
 *
 * Query params:
 * - slug: Article slug (optional, returns overall stats if not provided)
 * - days: Number of days to include (default: 30)
 */
export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams
		const slug = searchParams.get('slug')
		const days = parseInt(searchParams.get('days') || '30', 10)

		const startDate = new Date()
		startDate.setDate(startDate.getDate() - days)
		startDate.setHours(0, 0, 0, 0)

		const endDate = new Date()
		endDate.setHours(23, 59, 59, 999)

		// Get all views in date range
		const views = await getViewsByDateRange(startDate, endDate)

		// Filter by slug if provided
		const filteredViews = slug && slug !== 'all' ? views.filter((v) => v.slug === slug) : views

		// Calculate total views
		const totalViews = filteredViews.length

		// Calculate unique visitors
		const uniqueVisitors = new Set(filteredViews.map((v) => v.visitorId)).size

		// Calculate daily stats
		const dailyStatsMap = new Map<string, DailyStat>()

		filteredViews.forEach((view) => {
			const date = view.timestamp.split('T')[0]
			if (!dailyStatsMap.has(date)) {
				dailyStatsMap.set(date, { date, views: 0, visitors: new Set<string>() })
			}
			const stat = dailyStatsMap.get(date)!
			stat.views++
			// @ts-ignore - using Set for visitors counting
			stat.visitors.add(view.visitorId)
		})

		// Convert Set to count and sort by date
		const dailyStats = Array.from(dailyStatsMap.values())
			.map((stat) => ({
				date: stat.date,
				views: stat.views,
				visitors: typeof stat.visitors === 'number' ? stat.visitors : (stat.visitors as Set<string>).size
			}))
			.sort((a, b) => b.date.localeCompare(a.date))
			.slice(0, days)

		return NextResponse.json({
			slug: slug || 'all',
			totalViews,
			totalVisitors: uniqueVisitors,
			dailyStats
		})
	} catch (error) {
		console.error('Analytics stats error:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch stats', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		)
	}
}
