import { NextRequest, NextResponse } from 'next/server'
import { executeRedis } from '@/lib/analytics/redis'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
	try {
		const testResult = await executeRedis(async (redis) => {
			// Test connection by setting and getting a value
			await redis.set('test_key', 'test_value', 'EX', 60)
			const value = await redis.get('test_key')

			// Get Redis info
			const info = await redis.info('server')

			return {
				success: true,
				message: 'Redis connection successful',
				testValue: value,
				redisInfo: {
					connected: redis.status === 'ready',
					status: redis.status
				}
			}
		})

		return NextResponse.json(testResult)
	} catch (error) {
		console.error('Redis test error:', error)
		return NextResponse.json({
			error: 'Redis connection failed',
			details: error instanceof Error ? error.message : 'Unknown error',
			env: {
				KV_URL: !!process.env.KV_URL,
				REDIS_URL: !!process.env.REDIS_URL
			}
		}, { status: 500 })
	}
}
