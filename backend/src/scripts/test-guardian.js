const fetch = global.fetch || require('node-fetch')

async function loginGuardian(username, password) {
  const res = await fetch('http://localhost:4000/api/auth/login-guardian', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  const text = await res.text()
  console.log('login:', res.status, text)
  if (!res.ok) throw new Error('login failed')
  return JSON.parse(text).token
}

async function addStudent(token) {
  const res = await fetch('http://localhost:4000/api/guardians/me/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      roll_no: 'G-100',
      enrollment_no: 'ENR-100',
      name: 'Guardian Student',
      division: 'A',
      class: 'FY',
      semester: 'I',
      mobile: '9999999999',
      parent_mobile: '8888888888',
      local_address: 'Local Addr',
      permanent_address: 'Perm Addr',
      parent_occupation: 'Engineer',
      scholarship_id: 'SCH-100',
      scholarship_status: 'Approved',
      exam_form_status: 'Submitted'
    })
  })
  const text = await res.text()
  console.log('add:', res.status, text)
}

async function main() {
  const token = await loginGuardian('guardian.cse1', 'Password123!')
  await addStudent(token)
}

main().catch((e) => {
  console.error('error:', e.message)
  process.exit(1)
})
