const fs = require('fs')
const path = require('path')
const db = require('../config/db')

async function runSql(file) {
  const sql = fs.readFileSync(file, 'utf8')
  const client = await db.pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(sql)
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

async function main() {
  const cmd = process.argv[2]
  if (!cmd) {
    console.error('Usage: node src/scripts/db.js [migrate|seed]')
    process.exit(1)
  }
  try {
    if (cmd === 'migrate') {
      await runSql(path.resolve(__dirname, '../../db/schema.sql'))
      console.log('Migration completed')
    } else if (cmd === 'seed') {
      await runSql(path.resolve(__dirname, '../../db/seed.sql'))
      console.log('Seed completed')
    } else {
      console.error('Unknown command')
      process.exit(1)
    }
    process.exit(0)
  } catch (err) {
    console.error('DB script error:', err.message)
    process.exit(1)
  }
}

main()
