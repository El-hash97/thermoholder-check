import { sql } from './_db.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const rows = await sql`SELECT month FROM month_settings ORDER BY month ASC`
    res.status(200).json(rows.map(r => r.month))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to load months' })
  }
}
