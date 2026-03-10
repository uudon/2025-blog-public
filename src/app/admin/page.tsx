'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Stats {
	slug: string
	totalViews: number
	totalVisitors: number
	dailyStats: Array<{ date: string; views: number; visitors: number }>
}

interface TopArticle {
	slug: string
	views: number
	visitors: number
}

interface RecentView {
	id: string
	slug: string
	timestamp: string
	visitorId: string
	ip: string
	referrer?: string
	userAgent?: string
	country?: string
}

export default function AdminPage() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [isAuthenticated, setIsAuthenticated] = useState(false)
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [stats, setStats] = useState<Stats | null>(null)
	const [topArticles, setTopArticles] = useState<TopArticle[]>([])
	const [recentViews, setRecentViews] = useState<RecentView[]>([])
	const [loading, setLoading] = useState(false)
	const [activeTab, setActiveTab] = useState<'overview' | 'top' | 'recent'>('overview')

	// Check if already authenticated via URL param
	useEffect(() => {
		const urlPassword = searchParams.get('password')
		if (urlPassword) {
			// Verify password
			fetch(`/api/admin/verify?password=${encodeURIComponent(urlPassword)}`)
				.then((res) => res.json())
				.then((data) => {
					if (data.valid) {
						setIsAuthenticated(true)
						loadData()
					} else {
						setError('Invalid password')
					}
				})
				.catch(() => setError('Authentication failed'))
		}
	}, [searchParams])

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault()
		setError('')
		setLoading(true)

		try {
			const res = await fetch(`/api/admin/verify?password=${encodeURIComponent(password)}`)
			const data = await res.json()

			if (data.valid) {
				setIsAuthenticated(true)
				// Update URL to include password
				const newUrl = new URL(window.location.href)
				newUrl.searchParams.set('password', password)
				window.history.replaceState({}, '', newUrl.toString())
				loadData()
			} else {
				setError('Invalid password')
			}
		} catch {
			setError('Authentication failed')
		} finally {
			setLoading(false)
		}
	}

	const loadData = async () => {
		setLoading(true)
		try {
			// Load overall stats
			const statsRes = await fetch('/api/analytics/stats?slug=all&days=30')
			const statsData = await statsRes.json()
			setStats(statsData)

			// Load top articles
			const topRes = await fetch('/api/analytics/top?days=30&limit=20')
			const topData = await topRes.json()
			setTopArticles(topData.articles || [])

			// Load recent views from public JSON
			const viewsRes = await fetch('/analytics/data.json')
			const viewsData = await viewsRes.json()
			const sortedViews = (viewsData.pageViews || [])
				.sort((a: RecentView, b: RecentView) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
				.slice(0, 50)
			setRecentViews(sortedViews)
		} catch (err) {
			console.error('Failed to load data:', err)
			setError('Failed to load analytics data')
		} finally {
			setLoading(false)
		}
	}

	const handleLogout = () => {
		setIsAuthenticated(false)
		setPassword('')
		setStats(null)
		setTopArticles([])
		setRecentViews([])
		// Remove password from URL
		const newUrl = new URL(window.location.href)
		newUrl.searchParams.delete('password')
		window.history.replaceState({}, '', newUrl.toString())
	}

	if (!isAuthenticated) {
		return (
			<div className="min-h-screen flex items-center justify-center p-4">
				<div className="max-w-md w-full">
					<div className="bg-white rounded-lg shadow-xl p-8">
						<h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
						<form onSubmit={handleLogin} className="space-y-4">
							<div>
								<label htmlFor="password" className="block text-sm font-medium mb-2">
									Password
								</label>
								<input
									id="password"
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
									required
								/>
							</div>
							{error && <p className="text-red-500 text-sm">{error}</p>}
							<button
								type="submit"
								disabled={loading}
								className="w-full bg-brand text-white py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
							>
								{loading ? 'Verifying...' : 'Login'}
							</button>
						</form>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen p-6">
			<div className="max-w-7xl mx-auto">
				<div className="flex justify-between items-center mb-8">
					<h1 className="text-3xl font-bold">Analytics Dashboard</h1>
					<button
						onClick={handleLogout}
						className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
					>
						Logout
					</button>
				</div>

				{/* Tab Navigation */}
				<div className="flex gap-4 mb-6 border-b">
					<button
						onClick={() => setActiveTab('overview')}
						className={`px-4 py-2 ${activeTab === 'overview' ? 'border-b-2 border-brand text-brand' : 'text-gray-600'}`}
					>
						Overview
					</button>
					<button
						onClick={() => setActiveTab('top')}
						className={`px-4 py-2 ${activeTab === 'top' ? 'border-b-2 border-brand text-brand' : 'text-gray-600'}`}
					>
						Top Pages
					</button>
					<button
						onClick={() => setActiveTab('recent')}
						className={`px-4 py-2 ${activeTab === 'recent' ? 'border-b-2 border-brand text-brand' : 'text-gray-600'}`}
					>
						Recent Views
					</button>
				</div>

				{loading && !stats && <p className="text-center py-8">Loading...</p>}

				{activeTab === 'overview' && stats && (
					<div className="space-y-6">
						{/* Stats Cards */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="bg-white rounded-lg shadow p-6">
								<h3 className="text-lg font-semibold mb-2">Total Views (30 days)</h3>
								<p className="text-4xl font-bold text-brand">{stats.totalViews.toLocaleString()}</p>
							</div>
							<div className="bg-white rounded-lg shadow p-6">
								<h3 className="text-lg font-semibold mb-2">Unique Visitors (30 days)</h3>
								<p className="text-4xl font-bold text-brand">{stats.totalVisitors.toLocaleString()}</p>
							</div>
						</div>

						{/* Daily Chart */}
						<div className="bg-white rounded-lg shadow p-6">
							<h3 className="text-lg font-semibold mb-4">Daily Views (Last 30 Days)</h3>
							<ResponsiveContainer width="100%" height={300}>
								<BarChart data={stats.dailyStats.slice(0, 30).reverse()}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="date" />
									<YAxis />
									<Tooltip />
									<Bar dataKey="views" fill="#35bfab" />
								</BarChart>
							</ResponsiveContainer>
						</div>
					</div>
				)}

				{activeTab === 'top' && (
					<div className="bg-white rounded-lg shadow p-6">
						<h3 className="text-lg font-semibold mb-4">Top Pages (Last 30 Days)</h3>
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b">
										<th className="text-left py-3 px-4">Page</th>
										<th className="text-right py-3 px-4">Views</th>
										<th className="text-right py-3 px-4">Visitors</th>
									</tr>
								</thead>
								<tbody>
									{topArticles.map((article) => (
										<tr key={article.slug} className="border-b hover:bg-gray-50">
											<td className="py-3 px-4 font-mono text-sm">{article.slug}</td>
											<td className="text-right py-3 px-4">{article.views.toLocaleString()}</td>
											<td className="text-right py-3 px-4">{article.visitors.toLocaleString()}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{activeTab === 'recent' && (
					<div className="bg-white rounded-lg shadow p-6">
						<h3 className="text-lg font-semibold mb-4">Recent 50 Views</h3>
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b">
										<th className="text-left py-3 px-4">Time</th>
										<th className="text-left py-3 px-4">Page</th>
										<th className="text-left py-3 px-4">IP</th>
										<th className="text-left py-3 px-4">Country</th>
										<th className="text-left py-3 px-4">Referrer</th>
									</tr>
								</thead>
								<tbody>
									{recentViews.map((view) => (
										<tr key={view.id} className="border-b hover:bg-gray-50">
											<td className="py-3 px-4 whitespace-nowrap">
												{new Date(view.timestamp).toLocaleString()}
											</td>
											<td className="py-3 px-4 font-mono">{view.slug}</td>
											<td className="py-3 px-4">{view.ip}</td>
											<td className="py-3 px-4">{view.country || '-'}</td>
											<td className="py-3 px-4 max-w-xs truncate">{view.referrer || '-'}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
