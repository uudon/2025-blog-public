'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

interface PageViewTrackerProps {
	slug: string
	enabled?: boolean
}

/**
 * PageViewTracker component
 * Automatically tracks page views when mounted
 *
 * Usage:
 * <PageViewTracker slug="article-slug" />
 */
export function PageViewTracker({ slug, enabled = true }: PageViewTrackerProps) {
	const pathname = usePathname()
	const trackedRef = useRef(false)

	useEffect(() => {
		if (!enabled || trackedRef.current) return

		// Track page view
		const trackPageView = async () => {
			try {
				// Use sendBeacon for better performance and to ensure tracking even on page unload
				const data = JSON.stringify({ slug })

				if (navigator.sendBeacon) {
					const blob = new Blob([data], { type: 'application/json' })
					navigator.sendBeacon('/api/analytics/track', blob)
				} else {
					// Fallback to fetch
					await fetch('/api/analytics/track', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: data,
						// Keep alive for better reliability
						keepalive: true,
					})
				}

				trackedRef.current = true
			} catch (error) {
				console.error('Failed to track page view:', error)
			}
		}

		// Track after a small delay to ensure it's a real visit (not a bounce)
		const trackTimeout = setTimeout(trackPageView, 1000)

		return () => {
			clearTimeout(trackTimeout)
		}
	}, [slug, enabled, pathname])

	// This component doesn't render anything
	return null
}

/**
 * Hook to track page views
 * Alternative to using the component directly
 */
export function usePageViewTracking(slug: string, enabled = true) {
	useEffect(() => {
		if (!enabled) return

		const trackPageView = async () => {
			try {
				const data = JSON.stringify({ slug })

				if (navigator.sendBeacon) {
					const blob = new Blob([data], { type: 'application/json' })
					navigator.sendBeacon('/api/analytics/track', blob)
				} else {
					await fetch('/api/analytics/track', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: data,
						keepalive: true,
					})
				}
			} catch (error) {
				console.error('Failed to track page view:', error)
			}
		}

		const trackTimeout = setTimeout(trackPageView, 1000)
		return () => clearTimeout(trackTimeout)
	}, [slug, enabled])
}
