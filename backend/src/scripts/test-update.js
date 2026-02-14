const fetch = global.fetch || require('node-fetch')

async function login(email, password) {
  const res = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  if (!res.ok) throw new Error('login failed ' + res.status)
  const data = await res.json()
  return data.token
}

async function create(token) {
  const res = await fetch('http://localhost:4000/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name: 'Test User', roll_no: 'ZX-001', branch_id: 1 })
  })
  const text = await res.text()
  console.log('create:', res.status, text)
  if (!res.ok) throw new Error('create failed')
  return JSON.parse(text)
}

async function update(token, id) {
  const res = await fetch(`http://localhost:4000/api/students/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name: 'Test User Updated', roll_no: 'ZX-002', remark: 'updated via script' })
  })
  const text = await res.text()
  console.log('update:', res.status, text)
}

async function main() {
  const token = await login('admin.a.cse@example.com', 'Password123!')
  const stu = await create(token)
  await update(token, stu.id)
}

main().catch((e) => {
  console.error('script error:', e.message)
  process.exit(1)
})
