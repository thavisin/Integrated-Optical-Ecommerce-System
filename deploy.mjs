#!/usr/bin/env node
// Deploy OptiMart to Cloudflare Workers: API (D1 + R2) first, then the Next.js web app.
// Usage: node deploy.mjs [--dry-run]   — see DEPLOY.md
// Env (optional): API_URL, WEB_ORIGIN — needed only for custom domains / when workers.dev is off.
import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const DRY = process.argv.includes('--dry-run')
const API_DIR = 'apps/server'
const WEB_DIR = 'apps/web'

function run(cmd, { cwd = '.', env = {}, quiet = false } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, { cwd, shell: true, env: { ...process.env, ...env } })
    let out = ''
    const tee = (stream) => (d) => { out += d; if (!quiet) stream.write(d) }
    p.stdout.on('data', tee(process.stdout))
    p.stderr.on('data', tee(process.stderr))
    p.on('close', (code) => (code === 0 ? resolve(out) : reject(Object.assign(new Error(`failed (${code}): ${cmd}`), { out }))))
  })
}

const step = (msg) => console.log(`\n▶ ${msg}`)
const workersDevUrl = (out, name) => out.match(new RegExp(`https://${name}\\.[\\w.-]+\\.workers\\.dev`))?.[0]

async function deployApi(extra = '') {
  return run(`npx wrangler deploy${DRY ? ' --dry-run --outdir dist' : ''}${extra}`, { cwd: API_DIR })
}

let secretsFile
try {
  if (DRY) {
    step('dry run: build both Workers, nothing is uploaded')
    await deployApi()
    await run('npx opennextjs-cloudflare build', { cwd: WEB_DIR })
    await run('npx wrangler deploy --dry-run', { cwd: WEB_DIR })
    console.log('\n✅ dry run OK')
    process.exit(0)
  }

  step('checking Cloudflare login')
  await run('npx wrangler whoami --json', { cwd: API_DIR, quiet: true }).catch(() => {
    throw new Error('not logged in — run `npx wrangler login` (or set CLOUDFLARE_API_TOKEN) first')
  })

  // First deploy: generate JWT_SECRET and upload it with the version. Later deploys keep the existing one.
  let secretFlag = ''
  const secrets = await run('npx wrangler secret list --format json', { cwd: API_DIR, quiet: true }).catch(() => '[]')
  if (!secrets.includes('"JWT_SECRET"')) {
    step('JWT_SECRET missing — generating a random one')
    secretsFile = join(tmpdir(), `optimart-secrets-${process.pid}.json`)
    writeFileSync(secretsFile, JSON.stringify({ JWT_SECRET: randomBytes(32).toString('base64url') }), { mode: 0o600 })
    secretFlag = ` --secrets-file "${secretsFile}"`
  }

  // CORS_ORIGIN in wrangler.jsonc is the local value; production origin is injected with --var.
  let webOrigin = process.env.WEB_ORIGIN
  const corsFlag = () => (webOrigin ? ` --var CORS_ORIGIN:${webOrigin}` : '')

  step('deploying API (creates D1 optimart-db + R2 optimart-uploads on first run)')
  const apiOut = await deployApi(secretFlag + corsFlag())
  const apiUrl = process.env.API_URL || workersDevUrl(apiOut, 'optimart-api')
  if (!apiUrl) throw new Error('could not read API URL from wrangler output — set API_URL (and WEB_ORIGIN)')

  step('applying D1 migrations (remote)')
  await run('npx wrangler d1 migrations apply optimart-db --remote', { cwd: API_DIR })

  if (!webOrigin) {
    // workers.dev URLs share the account subdomain: optimart-api.<sub> → optimart-web.<sub>
    webOrigin = apiUrl.replace('//optimart-api.', '//optimart-web.')
    step(`setting API CORS_ORIGIN=${webOrigin}`)
    await deployApi(corsFlag())
  }

  step(`building + deploying web (NEXT_PUBLIC_API_URL=${apiUrl})`)
  await run('npx opennextjs-cloudflare build', { cwd: WEB_DIR, env: { NEXT_PUBLIC_API_URL: apiUrl } })
  await run('npx opennextjs-cloudflare deploy', { cwd: WEB_DIR })

  console.log(`\n✅ deployed\n   API: ${apiUrl}\n   Web: ${webOrigin}`)
  console.log('   First deploy? Load sample data: npm run seed:remote -w @optimart/server  (wipes existing rows)')
} catch (err) {
  console.error(`\n❌ ${err.message}`)
  process.exitCode = 1
} finally {
  if (secretsFile) rmSync(secretsFile, { force: true })
}
