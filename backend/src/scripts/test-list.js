const fetch = global.fetch || require('node-fetch')
async function main() {
  const login = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin.a.cse@example.com', password: 'Password123!' })
  })
  const { token } = await login.json()
  const res = await fetch('http://localhost:4000/api/students?page=1&limit=50', {
    headers: { Authorization: `Bearer ${token}` }
  })
  const data = await res.json()
  console.log(data.items.map((s) => ({ id: s.id, name: s.name, roll_no: s.roll_no })))
}
main().catch((e) => console.error(e))
