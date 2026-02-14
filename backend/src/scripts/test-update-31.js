const fetch = global.fetch || require('node-fetch')
async function main() {
  const login = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin.a.cse@example.com', password: 'Password123!' })
  })
  const { token } = await login.json()
  const res = await fetch('http://localhost:4000/api/students/31', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name: 'Bhakti Patil', roll_no: '20', ebc_status: 'Pending', remark: 'upload original income cert' })
  })
  const text = await res.text()
  console.log(res.status, text)
}
main().catch((e) => console.error(e))
