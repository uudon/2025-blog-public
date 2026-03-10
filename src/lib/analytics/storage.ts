import { promises as fs } from 'fs'
import path from 'path'

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

export interface AnalyticsData {
	pageViews: PageView[]
	metadata: {
		lastUpdated: string | null
		totalViews: number
		uniqueVisitors: number
	}
}

const DATA_FILE_PATH = path.join(
	process.cwd(),
	'public',
	'analytics',
	'data.json'
)

// Simple file locking mechanism using a lock file
const LOCK_FILE_PATH = path.join(process.cwd(), 'public', 'analytics', '.lock')
const MAX_LOCK_WAIT_TIME = 5000 // 5 seconds
const LOCK_RETRY_INTERVAL = 100 // 100ms

async function acquireLock(): Promise<void> {
	const startTime = Date.now()

	while (Date.now() - startTime < MAX_LOCK_WAIT_TIME) {
		try {
			await fs.writeFile(LOCK_FILE_PATH, Date.now().toString(), { flag: 'wx' })
			return // Lock acquired
		} catch (error) {
			// Lock file exists, wait and retry
			await new Promise((resolve) => setTimeout(resolve, LOCK_RETRY_INTERVAL))
		}
	}

	throw new Error('Could not acquire lock after maximum wait time')
}

async function releaseLock(): Promise<void> {
	try {
		await fs.unlink(LOCK_FILE_PATH)
	} catch (error) {
		// Ignore errors when releasing lock
	}
}

async function withLock<T>(operation: () => Promise<T>): Promise<T> {
	await acquireLock()
	try {
		return await operation()
	} finally {
		await releaseLock()
	}
}

export async function readAnalyticsData(): Promise<AnalyticsData> {
	try {
		const data = await fs.readFile(DATA_FILE_PATH, 'utf-8')
		return JSON.parse(data)
	} catch (error) {
		// If file doesn't exist or is corrupted, return default data
		return {
			pageViews: [],
			metadata: {
				lastUpdated: null,
				totalViews: 0,
				uniqueVisitors: 0,
			},
		}
	}
}

export async function writeAnalyticsData(data: AnalyticsData): Promise<void> {
	return withLock(async () => {
		// Update metadata
		data.metadata.lastUpdated = new Date().toISOString()
		data.metadata.totalViews = data.pageViews.length
		const uniqueVisitors = new Set(data.pageViews.map((v) => v.visitorId))
		data.metadata.uniqueVisitors = uniqueVisitors.size

		// Write to a temporary file first, then rename for atomic write
		const tempFilePath = DATA_FILE_PATH + '.tmp'
		await fs.writeFile(tempFilePath, JSON.stringify(data, null, 2), 'utf-8')
		await fs.rename(tempFilePath, DATA_FILE_PATH)
	})
}

export async function addPageView(pageView: PageView): Promise<void> {
	const data = await readAnalyticsData()
	data.pageViews.push(pageView)
	await writeAnalyticsData(data)
}

export async function getPageViews(limit?: number): Promise<PageView[]> {
	const data = await readAnalyticsData()
	const views = [...data.pageViews].sort(
		(a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
	)
	return limit ? views.slice(0, limit) : views
}

export async function getPageViewsBySlug(slug: string): Promise<PageView[]> {
	const data = await readAnalyticsData()
	return data.pageViews.filter((v) => v.slug === slug)
}

export async function getStats(): Promise<{
	totalViews: number
	uniqueVisitors: number
	topPages: Array<{ slug: string; views: number; uniqueVisitors: number }>
}> {
	const data = await readAnalyticsData()

	// Calculate stats per page
	const pageStats = new Map<
		string,
		{ views: number; uniqueVisitors: Set<string> }
	>()

	data.pageViews.forEach((view) => {
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
			uniqueVisitors: stats.uniqueVisitors.size,
		}))
		.sort((a, b) => b.views - a.views)
		.slice(0, 10)

	return {
		totalViews: data.metadata.totalViews,
		uniqueVisitors: data.metadata.uniqueVisitors,
		topPages,
	}
}

export async function getRecentViews(limit = 50): Promise<PageView[]> {
	return getPageViews(limit)
}

export async function getViewsByDateRange(
	startDate: Date,
	endDate: Date
): Promise<PageView[]> {
	const data = await readAnalyticsData()
	return data.pageViews.filter((view) => {
		const viewDate = new Date(view.timestamp)
		return viewDate >= startDate && viewDate <= endDate
	})
}
