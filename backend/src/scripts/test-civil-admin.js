const fetch = global.fetch || require('node-fetch')

async function login() {
  const res = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin.a.civil@example.com', password: 'Password123!' })
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(JSON.stringify(json))
  }
  return json.token
}

async function listStudents(token) {
  const res = await fetch('http://localhost:4000/api/students?limit=100', {
    headers: { Authorization: `Bearer ${token}` }
  })
  const text = await res.text()
  console.log(res.status, text)
}

async function main() {
  const token = await login()
  await listStudents(token)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
