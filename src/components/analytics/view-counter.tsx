'use client'

import { useEffect, useState } from 'react'
import { Eye } from 'lucide-react'

interface ViewCounterProps {
	slug: string
	showLabel?: boolean
	className?: string
}

interface StatsData {
	totalViews: number
	totalVisitors: number
}

/**
 * ViewCounter component
 * Displays the number of views for an article
 *
 * Usage:
 * <ViewCounter slug="article-slug" />
 */
export function ViewCounter({ slug, showLabel = false, className = '' }: ViewCounterProps) {
	const [stats, setStats] = useState<StatsData | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const fetchStats = async () => {
			try {
				const response = await fetch(`/api/analytics/stats?slug=${encodeURIComponent(slug)}&days=30`)
				if (response.ok) {
					const data = await response.json()
					setStats({
						totalViews: data.totalViews || 0,
						totalVisitors: data.totalVisitors || 0,
					})
				}
			} catch (error) {
				console.error('Failed to fetch view count:', error)
			} finally {
				setLoading(false)
			}
		}

		fetchStats()
	}, [slug])

	if (loading || !stats) {
		return (
			<div className={`flex items-center gap-1 text-sm text-secondary ${className}`}>
				<Eye size={14} />
				<span className="opacity-50">--</span>
			</div>
		)
	}

	// Format number (e.g., 1234 -> 1.2k)
	const formatNumber = (num: number): string => {
		if (num >= 1000000) {
			return `${(num / 1000000).toFixed(1)}M`
		}
		if (num >= 1000) {
			return `${(num / 1000).toFixed(1)}K`
		}
		return num.toString()
	}

	return (
		<div className={`flex items-center gap-1 text-sm text-secondary ${className}`}>
			<Eye size={14} />
			<span>{formatNumber(stats.totalViews)}</span>
			{showLabel && <span className="text-xs">views</span>}
		</div>
	)
}
