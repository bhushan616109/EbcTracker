const fs = require('fs')
const path = require('path')

const DATA_DIR = path.resolve(__dirname, '../../data')
const DATA_FILE = path.join(DATA_DIR, 'store.json')

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

function loadInitial(defaultState) {
  try {
    ensureDir()
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8')
      const parsed = JSON.parse(raw)
      return parsed
    }
  } catch (_) {}
  return defaultState
}

function save(state) {
  try {
    ensureDir()
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf8')
    return true
  } catch (_) {
    return false
  }
}

module.exports = { loadInitial, save }
