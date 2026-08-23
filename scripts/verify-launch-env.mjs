#!/usr/bin/env node
/**
 * Phase 1 launch env verifier.
 * Usage:
 *   node scripts/verify-launch-env.mjs
 *   node scripts/verify-launch-env.mjs --production
 *
 * Loads `.env.local` when present, then validates process.env.
 */

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const args = new Set(process.argv.slice(2))
const productionMode = args.has('--production')

function loadDotEnv(path) {
  if (!existsSync(path)) {
    return
  }

  const content = readFileSync(path, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const eq = trimmed.indexOf('=')
    if (eq <= 0) {
      continue
    }

    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

loadDotEnv(resolve(process.cwd(), '.env.local'))
loadDotEnv(resolve(process.cwd(), '.env'))

function env(name) {
  return String(process.env[name] ?? '').trim()
}

function isTruthy(name) {
  return env(name).toLowerCase() === 'true'
}

const errors = []
const warnings = []

function requireKeys(keys, label) {
  for (const key of keys) {
    if (!env(key)) {
      errors.push(`Missing ${label}: ${key}`)
    }
  }
}

function warnIfTruthy(key, message) {
  if (isTruthy(key)) {
    warnings.push(message)
  }
}

if (productionMode) {
  requireKeys([
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'FIREBASE_ADMIN_PROJECT_ID',
    'FIREBASE_ADMIN_CLIENT_EMAIL',
    'FIREBASE_ADMIN_PRIVATE_KEY',
    'VITE_SITE_URL',
    'VITE_ADMIN_EMAILS',
    'VITE_CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ], 'production')

  if (!isTruthy('VITE_CLOUDINARY_SIGNED_UPLOAD')) {
    warnings.push('VITE_CLOUDINARY_SIGNED_UPLOAD is not true — signed Cloudinary uploads are recommended in production.')
  }

  warnIfTruthy('VITE_LAUNCH_MODE', 'VITE_LAUNCH_MODE=true is unsafe for production builds.')
  warnIfTruthy('VITE_ALLOW_LOCAL_FALLBACK', 'VITE_ALLOW_LOCAL_FALLBACK=true disables live Firestore in production builds.')

  if (isTruthy('VITE_PREPAID_ENABLED')) {
    const hasBkash = Boolean(
      env('BKASH_USERNAME') && env('BKASH_PASSWORD') && env('BKASH_APP_KEY') && env('BKASH_APP_SECRET'),
    )
    const hasSslcommerz = Boolean(env('SSLCOMMERZ_STORE_ID') && env('SSLCOMMERZ_STORE_PASSWORD'))

    if (!hasBkash && !hasSslcommerz) {
      errors.push('VITE_PREPAID_ENABLED=true needs one complete provider: bKash (BKASH_USERNAME, BKASH_PASSWORD, BKASH_APP_KEY, BKASH_APP_SECRET) or SSLCommerz (SSLCOMMERZ_STORE_ID, SSLCOMMERZ_STORE_PASSWORD).')
    }

    if (hasBkash) {
      const bkashBase = env('BKASH_BASE_URL') || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta'
      if (/sandbox|tokenized\.sandbox/i.test(bkashBase)) {
        errors.push('BKASH_BASE_URL must be the live checkout URL when VITE_PREPAID_ENABLED=true (not sandbox).')
      }
    }

    if (hasSslcommerz) {
      const sslBase = env('SSLCOMMERZ_BASE_URL') || 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php'
      const sslValidation = env('SSLCOMMERZ_VALIDATION_URL')
        || 'https://sandbox.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php'

      if (/sandbox/i.test(sslBase) || /sandbox/i.test(sslValidation)) {
        errors.push('SSLCOMMERZ_BASE_URL / SSLCOMMERZ_VALIDATION_URL must use securepay.sslcommerz.com in production (not sandbox).')
      }

      if (!env('SSLCOMMERZ_IPN_URL') && !env('VITE_SITE_URL')) {
        errors.push('Set SSLCOMMERZ_IPN_URL or VITE_SITE_URL so SSLCommerz can reach /api/sslcommerz-ipn for IPN settlement.')
      }
    }

    if (!env('PREPAID_CALLBACK_URL') && !env('VITE_SITE_URL')) {
      warnings.push('Set PREPAID_CALLBACK_URL or VITE_SITE_URL for the gateway payment return URL.')
    }

    if (!env('UPSTASH_REDIS_REST_URL') || !env('UPSTASH_REDIS_REST_TOKEN')) {
      errors.push('Online payments require UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN so payment callback rate limits are shared across Vercel isolates.')
    }
  } else if (env('VITE_PREPAID_ENABLED') && env('VITE_PREPAID_ENABLED').toLowerCase() !== 'false') {
    warnings.push(`Unexpected VITE_PREPAID_ENABLED=${env('VITE_PREPAID_ENABLED')} — use false for COD-only launch.`)
  }

  if (!env('UPSTASH_REDIS_REST_URL') || !env('UPSTASH_REDIS_REST_TOKEN')) {
    warnings.push('UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN unset — API rate limits fall back to per-isolate memory and will not be shared across Vercel isolates.')
  }

  if (!env('VITE_GA_MEASUREMENT_ID')) {
    warnings.push('Missing VITE_GA_MEASUREMENT_ID (recommended before paid traffic).')
  }

  if (!env('VITE_META_PIXEL_ID')) {
    warnings.push('Missing VITE_META_PIXEL_ID (recommended before Meta campaigns).')
  }

  if (String(env('VITE_MOBILE_WALLET_PAYMENTS_ENABLED') || 'true').toLowerCase() === 'false') {
    warnings.push('VITE_MOBILE_WALLET_PAYMENTS_ENABLED=false hides bKash/Nagad Send Money on checkout.')
  } else if (!env('VITE_BKASH_MERCHANT_NUMBER') && !env('VITE_NAGAD_MERCHANT_NUMBER')) {
      warnings.push('Wallet payments enabled but merchant numbers use built-in defaults — confirm bKash/Nagad numbers in Vercel.')
  }
} else {
  console.log('Running dev checklist (use --production for launch gate).\n')
  if (!env('VITE_FIREBASE_PROJECT_ID')) {
    warnings.push('VITE_FIREBASE_* not set — copy .env.example to .env.local for Firebase dev.')
  }
}

if (errors.length) {
  console.error('❌ Launch env verification failed:\n')
  for (const message of errors) {
    console.error(`  - ${message}`)
  }
}

if (warnings.length) {
  console.warn('\n⚠️  Warnings:\n')
  for (const message of warnings) {
    console.warn(`  - ${message}`)
  }
}

if (!errors.length) {
  console.log(`\n✅ ${productionMode ? 'Production' : 'Development'} env check passed (${warnings.length} warning(s)).`)
  process.exit(0)
}

process.exit(1)
