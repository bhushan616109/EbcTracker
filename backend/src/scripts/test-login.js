const fetch = global.fetch || require('node-fetch')
async function main() {
  const base = process.env.BASE || 'http://localhost:4003'
  const identifier = process.env.IDENTIFIER || 'dean@example.com'
  const password = process.env.PASSWORD || 'Password123!'
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password })
  })
  const text = await res.text()
  console.log(res.status, text)
}
main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
