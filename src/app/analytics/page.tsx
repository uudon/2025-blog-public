'use client'

import { useEffect, useState } from 'react'
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface StatsData {
	slug: string
	totalViews: number
	totalVisitors: number
	dailyStats: Array<{
		date: string
		views: number
		visitors: number
	}>
}

interface TopArticle {
	slug: string
	views: number
	visitors: number
}

export default function AnalyticsPage() {
	const [overallStats, setOverallStats] = useState<StatsData | null>(null)
	const [topArticles, setTopArticles] = useState<TopArticle[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true)
				setError(null)

				// Fetch overall stats
				const statsRes = await fetch('/api/analytics/stats?slug=all&days=30')
				if (!statsRes.ok) throw new Error('Failed to fetch stats')
				const statsData = await statsRes.json()
				setOverallStats(statsData)

				// Fetch top articles
				const topRes = await fetch('/api/analytics/top?days=30&limit=10')
				if (!topRes.ok) throw new Error('Failed to fetch top articles')
				const topData = await topRes.json()
				setTopArticles(topData.articles || [])
			} catch (err: any) {
				setError(err.message)
			} finally {
				setLoading(false)
			}
		}

		fetchData()
	}, [])

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-secondary">加载中...</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-red-500">加载失败: {error}</div>
			</div>
		)
	}

	if (!overallStats) {
		return null
	}

	// Prepare chart data
	const chartData = overallStats.dailyStats
		.slice()
		.reverse()
		.map((d) => ({
			date: new Date(d.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
			views: d.views,
			visitors: d.visitors,
		}))

	// Format large numbers
	const formatNumber = (num: number): string => {
		if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
		if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
		return num.toString()
	}

	return (
		<div className="min-h-screen bg-background p-8">
			<div className="mx-auto max-w-7xl">
				<div className="mb-8">
					<h1 className="text-3xl font-bold">访问统计</h1>
					<p className="text-secondary mt-2">过去30天的访问数据</p>
				</div>

				{/* Stats Cards */}
				<div className="mb-8 grid gap-6 sm:grid-cols-2">
					<div className="rounded-xl border bg-card p-6 shadow-sm">
						<div className="text-secondary mb-2 text-sm font-medium">总访问量</div>
						<div className="text-4xl font-bold">{formatNumber(overallStats.totalViews)}</div>
						<div className="text-secondary mt-2 text-sm">页面浏览次数</div>
					</div>

					<div className="rounded-xl border bg-card p-6 shadow-sm">
						<div className="text-secondary mb-2 text-sm font-medium">独立访客</div>
						<div className="text-4xl font-bold">{formatNumber(overallStats.totalVisitors)}</div>
						<div className="text-secondary mt-2 text-sm">独立访问用户数</div>
					</div>
				</div>

				{/* Chart */}
				<div className="mb-8 rounded-xl border bg-card p-6 shadow-sm">
					<h2 className="mb-4 text-xl font-semibold">访问趋势</h2>
					<div className="h-[300px]">
						<ResponsiveContainer width="100%" height="100%">
							<LineChart data={chartData}>
								<XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
								<YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
								<Tooltip
									contentStyle={{
										backgroundColor: 'rgba(255, 255, 255, 0.9)',
										borderRadius: '8px',
										border: '1px solid #e5e5e5',
									}}
								/>
								<Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} dot={false} name="访问量" />
								<Line
									type="monotone"
									dataKey="visitors"
									stroke="#10b981"
									strokeWidth={2}
									dot={false}
									name="访客数"
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>
				</div>

				{/* Top Articles */}
				<div className="rounded-xl border bg-card p-6 shadow-sm">
					<h2 className="mb-4 text-xl font-semibold">热门文章</h2>
					<div className="space-y-3">
						{topArticles.map((article, index) => (
							<div
								key={article.slug}
								className="flex items-center justify-between rounded-lg border border-border bg-background p-4 transition-colors hover:bg-secondary/10">
								<div className="flex items-center gap-4">
									<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
										{index + 1}
									</div>
									<div>
										<div className="font-medium">{article.slug}</div>
										<div className="text-secondary text-sm">{formatNumber(article.visitors)} 独立访客</div>
									</div>
								</div>
								<div className="text-right">
									<div className="font-bold">{formatNumber(article.views)}</div>
									<div className="text-secondary text-sm">访问量</div>
								</div>
							</div>
						))}
						{topArticles.length === 0 && (
							<div className="text-secondary py-8 text-center">暂无数据</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
