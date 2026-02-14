const fetch = global.fetch || require('node-fetch')
async function main() {
  const res = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'principal@example.com', password: 'Password123!' })
  })
  const text = await res.text()
  console.log(res.status, text)
}
main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
