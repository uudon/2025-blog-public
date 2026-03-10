import { NextRequest, NextResponse } from 'next/server'
import Redis from 'ioredis'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
	try {
		const redisUrl = process.env.KV_URL || process.env.REDIS_URL

		if (!redisUrl) {
			return NextResponse.json({
				error: 'No Redis URL found',
				env: {
					KV_URL: !!process.env.KV_URL,
					REDIS_URL: !!process.env.REDIS_URL
				}
			})
		}

		const redis = new Redis(redisUrl, {
			maxRetriesPerRequest: 1,
			connectTimeout: 5000
		})

		// Test connection
		await new Promise<void>((resolve, reject) => {
			redis.on('connect', () => {
				console.log('Connected to Redis')
				resolve()
			})
			redis.on('error', (err) => {
				console.error('Redis error:', err)
				reject(err)
			})

			// Timeout after 5 seconds
			setTimeout(() => reject(new Error('Connection timeout')), 5000)
		})

		// Try to set and get a value
		await redis.set('test_key', 'test_value')
		const value = await redis.get('test_key')
		await redis.quit()

		return NextResponse.json({
			success: true,
			message: 'Redis connection successful',
			testValue: value,
			redisUrlPrefix: redisUrl.split('@')[1]?.split(':')[0] || 'unknown'
		})
	} catch (error) {
		console.error('Redis test error:', error)
		return NextResponse.json({
			error: 'Redis connection failed',
			details: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined
		}, { status: 500 })
	}
}
