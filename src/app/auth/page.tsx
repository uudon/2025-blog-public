'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'

export default function AuthPage() {
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)
	const router = useRouter()

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError('')
		setLoading(true)

		try {
			const response = await fetch('/api/auth', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password })
			})

			const data = await response.json()

			if (response.ok) {
				router.push('/')
				router.refresh()
			} else {
				setError(data.error || '密码错误')
			}
		} catch {
			setError('验证失败，请重试')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<div className="w-full max-w-md">
				<div className="bg-card rounded-2xl shadow-xl border border-border p-8">
					<div className="flex flex-col items-center mb-8">
						<div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mb-4">
							<Lock className="w-8 h-8 text-brand" />
						</div>
						<h1 className="text-2xl font-bold text-primary">需要验证</h1>
						<p className="text-secondary mt-2 text-center">
							请输入访问密码以继续
						</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="请输入密码"
								className="w-full px-4 py-3 rounded-lg bg-bg border border-border text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
								autoFocus
								disabled={loading}
							/>
						</div>

						{error && (
							<p className="text-red-500 text-sm text-center">{error}</p>
						)}

						<button
							type="submit"
							disabled={loading || !password}
							className="w-full py-3 px-4 bg-brand text-white rounded-lg font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
						>
							{loading ? '验证中...' : '进入网站'}
						</button>
					</form>

					<p className="text-xs text-secondary text-center mt-6">
						密码有效期 1 天，过期后需重新输入
					</p>
				</div>
			</div>
		</div>
	)
}
