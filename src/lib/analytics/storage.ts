import { kv } from '@vercel/kv'

export interface PageView {
	id: string
	slug: string
	timestamp: string
	visitorId: string
	ip: string
	referrer?: string
	userAgent?: string
	country?: string
}

const PAGE_VIEWS_KEY = 'analytics:page_views'
const METADATA_KEY = 'analytics:metadata'

interface AnalyticsMetadata {
	lastUpdated: string | null
	totalViews: number
	uniqueVisitors: number
}

// Helper function to get all page views
async function getAllPageViews(): Promise<PageView[]> {
	const views = await kv.get<PageView[]>(PAGE_VIEWS_KEY)
	return views || []
}

// Helper function to save all page views
async function saveAllPageViews(views: PageView[]): Promise<void> {
	await kv.set(PAGE_VIEWS_KEY, views)
}

// Helper function to get and update metadata
async function updateMetadata(pageViews: PageView[]): Promise<void> {
	const uniqueVisitors = new Set(pageViews.map((v) => v.visitorId)).size
	const metadata: AnalyticsMetadata = {
		lastUpdated: new Date().toISOString(),
		totalViews: pageViews.length,
		uniqueVisitors
	}
	await kv.set(METADATA_KEY, metadata)
}

export async function readAnalyticsData(): Promise<{
	pageViews: PageView[]
	metadata: AnalyticsMetadata
}> {
	const pageViews = await getAllPageViews()
	const metadata = await kv.get<AnalyticsMetadata>(METADATA_KEY)

	return {
		pageViews,
		metadata: metadata || {
			lastUpdated: null,
			totalViews: 0,
			uniqueVisitors: 0
		}
	}
}

export async function writeAnalyticsData(data: {
	pageViews: PageView[]
	metadata: AnalyticsMetadata
}): Promise<void> {
	await saveAllPageViews(data.pageViews)
	await kv.set(METADATA_KEY, data.metadata)
}

export async function addPageView(pageView: PageView): Promise<void> {
	const views = await getAllPageViews()
	views.push(pageView)
	await saveAllPageViews(views)
	await updateMetadata(views)
}

export async function getPageViews(limit?: number): Promise<PageView[]> {
	const views = await getAllPageViews()
	const sorted = views.sort(
		(a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
	)
	return limit ? sorted.slice(0, limit) : sorted
}

export async function getPageViewsBySlug(slug: string): Promise<PageView[]> {
	const views = await getAllPageViews()
	return views.filter((v) => v.slug === slug)
}

export async function getStats(): Promise<{
	totalViews: number
	uniqueVisitors: number
	topPages: Array<{ slug: string; views: number; uniqueVisitors: number }>
}> {
	const views = await getAllPageViews()

	// Calculate stats per page
	const pageStats = new Map<string, { views: number; uniqueVisitors: Set<string> }>()

	views.forEach((view) => {
		if (!pageStats.has(view.slug)) {
			pageStats.set(view.slug, { views: 0, uniqueVisitors: new Set() })
		}
		const stats = pageStats.get(view.slug)!
		stats.views++
		stats.uniqueVisitors.add(view.visitorId)
	})

	const topPages = Array.from(pageStats.entries())
		.map(([slug, stats]) => ({
			slug,
			views: stats.views,
			uniqueVisitors: stats.uniqueVisitors.size
		}))
		.sort((a, b) => b.views - a.views)
		.slice(0, 10)

	const metadata = await kv.get<AnalyticsMetadata>(METADATA_KEY)

	return {
		totalViews: metadata?.totalViews || 0,
		uniqueVisitors: metadata?.uniqueVisitors || 0,
		topPages
	}
}

export async function getRecentViews(limit = 50): Promise<PageView[]> {
	return getPageViews(limit)
}

export async function getViewsByDateRange(
	startDate: Date,
	endDate: Date
): Promise<PageView[]> {
	const views = await getAllPageViews()
	return views.filter((view) => {
		const viewDate = new Date(view.timestamp)
		return viewDate >= startDate && viewDate <= endDate
	})
}
