const fetch = global.fetch || require('node-fetch')

async function login(email, password) {
  const res = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const { token } = await res.json()
  return token
}

async function summary(token, branch_id) {
  const res = await fetch('http://localhost:4000/api/dashboard/summary' + (branch_id ? `?branch_id=${branch_id}` : ''), {
    headers: { Authorization: `Bearer ${token}` }
  })
  const text = await res.text()
  console.log('branch', branch_id || 'ALL', res.status, text)
}

async function main() {
  const token = await login('principal@example.com', 'Password123!')
  await summary(token, 1)
  await summary(token, 2)
  await summary(token)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
