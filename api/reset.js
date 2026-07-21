import { sql } from './_db.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { month } = req.body || {}
  if (!month) {
    res.status(400).json({ error: 'month is required' })
    return
  }

  try {
    await sql`DELETE FROM month_settings WHERE month = ${month}`
    res.status(200).json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to reset month' })
  }
}
