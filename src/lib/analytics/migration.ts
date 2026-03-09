/**
 * Analytics Database Setup Script
 *
 * This script sets up the D1 database for analytics.
 *
 * Prerequisites:
 * 1. Install Wrangler: npm install -g wrangler
 * 2. Authenticate: wrangler login
 *
 * Setup steps:
 * 1. Create D1 database:
 *    wrangler d1 create blog-analytics
 *
 * 2. Update wrangler.toml with the returned database_id
 *
 * 3. Create KV namespace:
 *    wrangler kv:namespace create "ANALYTICS_CACHE"
 *
 * 4. Update wrangler.toml with the returned namespace id
 *
 * 5. Run migrations:
 *    wrangler d1 execute blog-analytics --local --file=./src/lib/analytics/schema.sql
 *
 * 6. For production:
 *    wrangler d1 execute blog-analytics --file=./src/lib/analytics/schema.sql
 */

import { readFileSync } from 'fs'
import { join } from 'path'

// Get schema SQL
const schemaPath = join(process.cwd(), 'src/lib/analytics/schema.sql')
const schema = readFileSync(schemaPath, 'utf-8')

console.log('Analytics Database Setup')
console.log('========================\n')
console.log('1. Create D1 database:')
console.log('   wrangler d1 create blog-analytics\n')
console.log('2. Update wrangler.toml with the database_id\n')
console.log('3. Create KV namespace:')
console.log('   wrangler kv:namespace create "ANALYTICS_CACHE"\n')
console.log('4. Update wrangler.toml with the namespace id\n')
console.log('5. Run local migrations:')
console.log('   wrangler d1 execute blog-analytics --local --file=./src/lib/analytics/schema.sql\n')
console.log('6. Run production migrations:')
console.log('   wrangler d1 execute blog-analytics --file=./src/lib/analytics/schema.sql\n')
console.log('\nSchema SQL content:')
console.log('---')
console.log(schema)
console.log('---')
