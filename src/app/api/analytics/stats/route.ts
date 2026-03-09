/**
 * Analytics stats API endpoint
 * Returns analytics data for articles
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashIp, isBot, extractCountry, extractReferrer } from '@/lib/analytics/utils'

export const runtime = 'nodejs'

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

		if (slug === 'all' || !slug) {
			// Get overall stats
			const totalStats = await prisma.pageView.aggregate({
				_count: true,
				_total_views: { sum: { id: true } },
				_unique_visitors: { count: { distinct: ['visitorId'] } },
				where: {
					timestamp: {
						gte: startDate
					}
				}
			})

			// Get daily stats
			const dailyStats = await prisma.dailyStats.findMany({
				where: {
					slug: 'all',
					date: {
						gte: new Date(new Date().setDate(new Date().getDate() - days))
					}
				},
				orderBy: {
					date: 'desc'
				},
				take: days
			})

			return NextResponse.json({
				slug: 'all',
				totalViews: totalStats._count || 0,
				totalVisitors: totalStats._unique_visitors || 0,
				dailyStats: dailyStats.map((d) => ({
					date: d.date.toISOString().split('T')[0],
					views: d.pageViews,
					visitors: d.uniqueVisitors
				}))
			})
		} else {
			// Get specific article stats
			const articleStats = await prisma.pageView.aggregate({
				_count: true,
				where: {
					slug,
					timestamp: {
						gte: startDate
					}
				}
			})

			const uniqueVisitors = await prisma.pageView.groupBy({
				by: ['visitorId'],
				where: {
					slug,
					timestamp: {
						gte: startDate
					}
				},
				_count: true
			})

			// Get daily stats
			const dailyStats = await prisma.dailyStats.findMany({
				where: {
					slug,
					date: {
						gte: new Date(new Date().setDate(new Date().getDate() - days))
					}
				},
				orderBy: {
					date: 'desc'
				},
				take: days
			})

			return NextResponse.json({
				slug,
				totalViews: articleStats._count || 0,
				totalVisitors: uniqueVisitors.length || 0,
				dailyStats: dailyStats.map((d) => ({
					date: d.date.toISOString().split('T')[0],
					views: d.pageViews,
					visitors: d.uniqueVisitors
				}))
			})
		}
	} catch (error) {
		console.error('Analytics stats error:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch stats', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		)
	}
}
