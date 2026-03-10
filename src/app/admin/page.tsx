'use client'

import { useEffect, useState } from 'react'
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

// Separate component that uses search params
function AdminContent() {
	const [isAuthenticated, setIsAuthenticated] = useState(false)
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [stats, setStats] = useState<Stats | null>(null)
	const [topArticles, setTopArticles] = useState<TopArticle[]>([])
	const [recentViews, setRecentViews] = useState<RecentView[]>([])
	const [loading, setLoading] = useState(false)
	const [activeTab, setActiveTab] = useState<'overview' | 'top' | 'recent'>('overview')

	// Check URL params on mount
	useEffect(() => {
		const params = new URLSearchParams(window.location.search)
		const urlPassword = params.get('password')
		if (urlPassword) {
			// Verify password
			fetch(`/api/admin/verify?password=${encodeURIComponent(urlPassword)}`)
				.then(res => res.json())
				.then(data => {
					if (data.valid) {
						setIsAuthenticated(true)
						loadData()
					} else {
						setError('Invalid password')
					}
				})
				.catch(() => setError('Authentication failed'))
		}
	}, [])

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
				const url = new URL(window.location.href)
				url.searchParams.set('password', password)
				window.history.replaceState({}, '', url.toString())
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

			// Load recent views from API
			const viewsRes = await fetch('/api/analytics/views?limit=50')
			const viewsData = await viewsRes.json()
			setRecentViews(viewsData.views || [])
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
		const url = new URL(window.location.href)
		url.searchParams.delete('password')
		window.history.replaceState({}, '', url.toString())
	}

	if (!isAuthenticated) {
		return (
			<div className='flex min-h-screen items-center justify-center p-4'>
				<div className='w-full max-w-md'>
					<div className='rounded-lg bg-white p-8 shadow-xl'>
						<h1 className='mb-6 text-center text-2xl font-bold'>Admin Login</h1>
						<form onSubmit={handleLogin} className='space-y-4'>
							<div>
								<label htmlFor='password' className='mb-2 block text-sm font-medium'>
									Password
								</label>
								<input
									id='password'
									type='password'
									value={password}
									onChange={e => setPassword(e.target.value)}
									className='focus:ring-brand w-full rounded-lg border px-4 py-2 focus:ring-2 focus:outline-none'
									required
								/>
							</div>
							{error && <p className='text-sm text-red-500'>{error}</p>}
							<button type='submit' disabled={loading} className='bg-brand w-full rounded-lg py-2 text-white hover:opacity-90 disabled:opacity-50'>
								{loading ? 'Verifying...' : 'Login'}
							</button>
						</form>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className='min-h-screen p-6'>
			<div className='mx-auto max-w-7xl'>
				<div className='mb-8 flex items-center justify-between'>
					<h1 className='text-3xl font-bold'>Analytics Dashboard</h1>
					<button onClick={handleLogout} className='rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300'>
						Logout
					</button>
				</div>

				{/* Tab Navigation */}
				<div className='mb-6 flex gap-4 border-b'>
					<button
						onClick={() => setActiveTab('overview')}
						className={`px-4 py-2 ${activeTab === 'overview' ? 'border-brand text-brand border-b-2' : 'text-gray-600'}`}>
						Overview
					</button>
					<button onClick={() => setActiveTab('top')} className={`px-4 py-2 ${activeTab === 'top' ? 'border-brand text-brand border-b-2' : 'text-gray-600'}`}>
						Top Pages
					</button>
					<button
						onClick={() => setActiveTab('recent')}
						className={`px-4 py-2 ${activeTab === 'recent' ? 'border-brand text-brand border-b-2' : 'text-gray-600'}`}>
						Recent Views
					</button>
				</div>

				{loading && !stats && <p className='py-8 text-center'>Loading...</p>}

				{activeTab === 'overview' && stats && (
					<div className='space-y-6'>
						{/* Stats Cards */}
						<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
							<div className='rounded-lg bg-white p-6 shadow'>
								<h3 className='mb-2 text-lg font-semibold'>Total Views (30 days)</h3>
								<p className='text-brand text-4xl font-bold'>{stats.totalViews.toLocaleString()}</p>
							</div>
							<div className='rounded-lg bg-white p-6 shadow'>
								<h3 className='mb-2 text-lg font-semibold'>Unique Visitors (30 days)</h3>
								<p className='text-brand text-4xl font-bold'>{stats.totalVisitors.toLocaleString()}</p>
							</div>
						</div>

						{/* Daily Chart */}
						<div className='rounded-lg bg-white p-6 shadow'>
							<h3 className='mb-4 text-lg font-semibold'>Daily Views (Last 30 Days)</h3>
							<ResponsiveContainer width='100%' height={300}>
								<BarChart data={stats.dailyStats.slice(0, 30).reverse()}>
									<CartesianGrid strokeDasharray='3 3' />
									<XAxis dataKey='date' />
									<YAxis />
									<Tooltip />
									<Bar dataKey='views' fill='#35bfab' />
								</BarChart>
							</ResponsiveContainer>
						</div>
					</div>
				)}

				{activeTab === 'top' && (
					<div className='rounded-lg bg-white p-6 shadow'>
						<h3 className='mb-4 text-lg font-semibold'>Top Pages (Last 30 Days)</h3>
						<div className='overflow-x-auto'>
							<table className='w-full'>
								<thead>
									<tr className='border-b'>
										<th className='px-4 py-3 text-left'>Page</th>
										<th className='px-4 py-3 text-right'>Views</th>
										<th className='px-4 py-3 text-right'>Visitors</th>
									</tr>
								</thead>
								<tbody>
									{topArticles.map(article => (
										<tr key={article.slug} className='border-b hover:bg-gray-50'>
											<td className='px-4 py-3 font-mono text-sm'>{article.slug}</td>
											<td className='px-4 py-3 text-right'>{article.views.toLocaleString()}</td>
											<td className='px-4 py-3 text-right'>{article.visitors.toLocaleString()}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{activeTab === 'recent' && (
					<div className='rounded-lg bg-white p-6 shadow'>
						<h3 className='mb-4 text-lg font-semibold'>Recent 50 Views</h3>
						<div className='overflow-x-auto'>
							<table className='w-full text-sm'>
								<thead>
									<tr className='border-b'>
										<th className='px-4 py-3 text-left'>Time</th>
										<th className='px-4 py-3 text-left'>Page</th>
										<th className='px-4 py-3 text-left'>IP</th>
										<th className='px-4 py-3 text-left'>Country</th>
										<th className='px-4 py-3 text-left'>Referrer</th>
									</tr>
								</thead>
								<tbody>
									{recentViews.map(view => (
										<tr key={view.id} className='border-b hover:bg-gray-50'>
											<td className='px-4 py-3 whitespace-nowrap'>{new Date(view.timestamp).toLocaleString()}</td>
											<td className='px-4 py-3 font-mono'>{view.slug}</td>
											<td className='px-4 py-3'>{view.ip}</td>
											<td className='px-4 py-3'>{view.country || '-'}</td>
											<td className='max-w-xs truncate px-4 py-3'>{view.referrer || '-'}</td>
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

export default function AdminPage() {
	return <AdminContent />
}
