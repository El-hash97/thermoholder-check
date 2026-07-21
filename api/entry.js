import { sql, rowToEntry, DEFAULT_QUICKCHECKER_REF, DEFAULT_STD_TOLERANCE } from './_db.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { month, entry } = req.body || {}
  if (!month || !entry || !entry.id || !entry.date || !entry.group) {
    res.status(400).json({ error: 'month and entry {id, date, group, values} are required' })
    return
  }

  try {
    await sql`
      INSERT INTO month_settings (month, quickchecker_ref, std_tolerance)
      VALUES (${month}, ${DEFAULT_QUICKCHECKER_REF}, ${DEFAULT_STD_TOLERANCE})
      ON CONFLICT (month) DO NOTHING
    `

    const timestamp = entry.timestamp || new Date().toISOString()

    const rows = await sql`
      INSERT INTO entries (id, month, entry_date, shift_group, entry_timestamp, values_json)
      VALUES (${entry.id}, ${month}, ${entry.date}, ${entry.group}, ${timestamp}, ${JSON.stringify(entry.values || {})}::jsonb)
      ON CONFLICT (id) DO UPDATE SET
        entry_date = EXCLUDED.entry_date,
        shift_group = EXCLUDED.shift_group,
        entry_timestamp = EXCLUDED.entry_timestamp,
        values_json = EXCLUDED.values_json
      RETURNING id, entry_date, shift_group, entry_timestamp, values_json
    `

    res.status(200).json(rowToEntry(rows[0]))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to save entry' })
  }
}
