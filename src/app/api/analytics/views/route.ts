import { NextRequest, NextResponse } from 'next/server'
import { getRecentViews } from '@/lib/analytics/storage'

export const runtime = 'nodejs'

/**
 * GET /api/analytics/views
 * Returns recent page views
 *
 * Query params:
 * - limit: Number of views to return (default: 50)
 */
export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams
		const limit = parseInt(searchParams.get('limit') || '50', 10)

		const views = await getRecentViews(limit)

		return NextResponse.json({ views })
	} catch (error) {
		console.error('Analytics views error:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch views', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		)
	}
}
