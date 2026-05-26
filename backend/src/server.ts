import { buildApp } from './app.ts'
import { loadConfig } from './config.ts'
import { openDatabase } from './db.ts'

const config = loadConfig()
const db = openDatabase(config)
const app = buildApp(db, config)

app.listen(config.port, () => {
  console.log(`hotel-booking backend listening on http://localhost:${config.port}`)
})
