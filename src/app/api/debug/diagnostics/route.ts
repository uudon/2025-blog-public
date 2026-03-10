import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
	const diagnostics: any = {
		timestamp: new Date().toISOString(),
		env: {
			NODE_ENV: process.env.NODE_ENV,
			VERCEL: process.env.VERCEL,
			KV_URL: process.env.KV_URL ? 'SET (length: ' + process.env.KV_URL.length + ')' : 'NOT SET',
			REDIS_URL: process.env.REDIS_URL ? 'SET (length: ' + process.env.REDIS_URL.length + ')' : 'NOT SET',
			DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
		},
		network: {}
	}

	// Test basic connectivity
	try {
		const testFetch = await fetch('https://www.google.com', {
			method: 'HEAD',
			signal: AbortSignal.timeout(5000)
		})
		diagnostics.network.externalFetch = 'OK (' + testFetch.status + ')'
	} catch (error: any) {
		diagnostics.network.externalFetch = 'FAILED: ' + (error?.message || 'Unknown')
	}

	// Test DNS resolution for Redis host
	try {
		const redisUrl = process.env.KV_URL || process.env.REDIS_URL
		if (redisUrl) {
			const match = redisUrl.match(/@([^:]+):(\d+)/)
			if (match) {
				const host = match[1]
				const port = match[2]
				diagnostics.redis = {
					host,
					port,
					urlFormat: redisUrl.split('@')[0].split('://')[0] + '://***@' + host + ':' + port
				}
			}
		}
	} catch (error: any) {
		diagnostics.redis = { error: 'Failed to parse Redis URL' }
	}

	// Test ioredis import
	try {
		const RedisModule = await import('ioredis')
		diagnostics.ioredis = {
			installed: true,
			version: RedisModule.version || 'unknown'
		}
	} catch (error: any) {
		diagnostics.ioredis = {
			installed: false,
			error: error?.message || 'Unknown'
		}
	}

	// Try to create a Redis client and ping
	if (process.env.REDIS_URL || process.env.KV_URL) {
		try {
			const RedisModule = await import('ioredis')
			const Redis = RedisModule.default
			const redisUrl = process.env.REDIS_URL || process.env.KV_URL

			const redis = new Redis(redisUrl, {
				maxRetriesPerRequest: 0,
				enableReadyCheck: false,
				lazyConnect: false,
				connectTimeout: 3000,
				commandTimeout: 3000
			})

			// Try to ping with timeout
			const pingPromise = redis.ping()
			const timeoutPromise = new Promise((_, reject) => {
				setTimeout(() => reject(new Error('Timeout after 3s')), 3000)
			})

			const pingResult = await Promise.race([pingPromise, timeoutPromise]) as any

			diagnostics.redisConnection = {
				success: true,
				ping: pingResult
			}

			await redis.quit()
		} catch (error: any) {
			diagnostics.redisConnection = {
				success: false,
				error: error?.message || 'Unknown',
				stack: error?.stack?.split('\n').slice(0, 3).join('\n')
			}
		}
	}

	return NextResponse.json(diagnostics)
}
