const bcrypt = require('bcryptjs')
const pwd = process.argv[2] || 'Password123!'
bcrypt.hash(pwd, 10).then((h) => {
  console.log(h)
})
