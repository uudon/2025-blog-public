import Redis from 'ioredis'

const getRedisUrl = (): string => {
	const url = process.env.KV_URL || process.env.REDIS_URL
	if (!url) {
		throw new Error('KV_URL or REDIS_URL environment variable is not set')
	}
	return url
}

// Serverless-friendly Redis connection manager
// Creates a new connection for each operation and closes it after
class RedisClient {
	private static instance: Redis | null = null
	private static isConnecting: boolean = false

	/**
	 * Get a Redis connection
	 * In serverless, we create a new connection per request or use a cached one
	 */
	static async connect(): Promise<Redis> {
		// If we have an active connection, return it
		if (this.instance && this.instance.status === 'ready') {
			return this.instance
		}

		// Prevent multiple simultaneous connection attempts
		if (this.isConnecting) {
			// Wait for existing connection to complete
			await new Promise(resolve => setTimeout(resolve, 100))
			return this.connect()
		}

		this.isConnecting = true

		try {
			const REDIS_URL = getRedisUrl()
			const redis = new Redis(REDIS_URL, {
				maxRetriesPerRequest: 2,
				enableReadyCheck: true,
				lazyConnect: true,
				connectTimeout: 5000,
				retryStrategy: (times) => {
					if (times > 2) return null
					return Math.min(times * 100, 2000)
				}
			})

			// Wait for connection to be ready
			await new Promise<void>((resolve, reject) => {
				const timeout = setTimeout(() => {
					reject(new Error('Redis connection timeout'))
				}, 5000)

				redis.on('ready', () => {
					clearTimeout(timeout)
					console.log('Redis Client Ready')
					resolve()
				})

				redis.on('error', (err) => {
					clearTimeout(timeout)
					console.error('Redis connection error:', err)
					reject(err)
				})

				// Start connection
				redis.connect().catch(reject)
			})

			this.instance = redis
			this.isConnecting = false

			return redis
		} catch (error) {
			this.isConnecting = false
			this.instance = null
			throw error
		}
	}

	/**
	 * Execute a Redis operation with automatic connection management
	 */
	static async execute<T>(operation: (redis: Redis) => Promise<T>): Promise<T> {
		const redis = await this.connect()

		try {
			return await operation(redis)
		} catch (error) {
			// If operation fails, close connection and try once more
			console.error('Redis operation failed, retrying...', error)
			try {
				if (this.instance) {
					await this.instance.quit()
					this.instance = null
				}
			} catch {}

			// Create new connection and retry
			const newRedis = await this.connect()
			return await operation(newRedis)
		}
	}

	/**
	 * Close the Redis connection
	 */
	static async disconnect(): Promise<void> {
		if (this.instance) {
			try {
				await this.instance.quit()
			} catch (error) {
				console.error('Error closing Redis connection:', error)
			}
			this.instance = null
		}
		this.isConnecting = false
	}
}

/**
 * Get Redis client for operations
 * Prefer using execute() for automatic connection management
 */
export async function getRedis(): Promise<Redis> {
	return RedisClient.connect()
}

/**
 * Execute a Redis operation with automatic connection management
 */
export async function executeRedis<T>(operation: (redis: Redis) => Promise<T>): Promise<T> {
	return RedisClient.execute(operation)
}

/**
 * Close Redis connection (optional, for cleanup)
 */
export async function closeRedis(): Promise<void> {
	return RedisClient.disconnect()
}
