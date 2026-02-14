const fetch = global.fetch || require('node-fetch')

async function login() {
  const res = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'principal@example.com', password: 'Password123!' })
  })
  const { token } = await res.json()
  return token
}

async function main() {
  const token = await login()
  const res = await fetch('http://localhost:4000/api/branches', {
    headers: { Authorization: `Bearer ${token}` }
  })
  console.log(await res.text())
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
