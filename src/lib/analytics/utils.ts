/**
 * Analytics utility functions
 * IP hashing, bot detection, and data extraction
 */

/**
 * Hash IP address for privacy
 * Removes last octet and adds salt
 */
export async function hashIp(ip: string): Promise<string> {
	const crypto = require('crypto')

	// Remove last octet for privacy
	const ipParts = ip.split('.')
	const maskedIp = ipParts.length === 4 ? `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}` : ip

	// Add salt and hash
	const salt = 'analytics-salt-2025'
	const data = `${maskedIp}${salt}`

	return crypto.createHash('sha256').update(data).digest('hex')
}

/**
 * Check if user agent is a bot
 */
export function isBot(userAgent: string): { isBot: boolean; name?: string } {
	const bots = [
		'googlebot',
		'bingbot',
		'slurp',
		'duckduckbot',
		'baiduspider',
		'yandexbot',
		'facebookexternalhit',
		'twitterbot',
		'linkedinbot',
		'embedly',
		'quora link preview',
		'showsthere',
		'pinterest',
		'applebot',
		'baidubot',
		' crawler'
	]

	const lowerUA = userAgent.toLowerCase()

	for (const bot of bots) {
		if (lowerUA.includes(bot)) {
			return { isBot: true, name: bot }
		}
	}

	return { isBot: false }
}

/**
 * Extract country from headers
 */
export function extractCountry(headers: Headers): string | undefined {
	return headers.get('cf-ipcountry') || undefined
}

/**
 * Extract referrer from headers
 */
export function extractReferrer(headers: Headers, origin: string): string | undefined {
	const referrer = headers.get('referer')

	if (!referrer) return undefined

	// Remove internal referrer
	try {
		const referrerUrl = new URL(referrer)
		if (referrerUrl.origin === origin) {
			return undefined
		}
		return referrer
	} catch {
		return referrer
	}
}

/**
 * Generate Prisma client for analytics operations
 * Wraps operations in error handling
 */
export async function recordPageView(
	slug: string,
	visitorId: string,
	referrer: string | undefined,
	userAgent: string | undefined,
	country: string | undefined
) {
	const { prisma } = await import('@/lib/prisma')

	// Implement your page view recording logic here
	// This is a placeholder function
}
