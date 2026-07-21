import { sql, rowToEntry, DEFAULT_QUICKCHECKER_REF, DEFAULT_STD_TOLERANCE } from './_db.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const month = req.query.month
  if (!month) {
    res.status(400).json({ error: 'month is required' })
    return
  }

  try {
    const settingsRows = await sql`
      SELECT quickchecker_ref, std_tolerance FROM month_settings WHERE month = ${month}
    `

    let settings = settingsRows[0]
    if (!settings) {
      const inserted = await sql`
        INSERT INTO month_settings (month, quickchecker_ref, std_tolerance)
        VALUES (${month}, ${DEFAULT_QUICKCHECKER_REF}, ${DEFAULT_STD_TOLERANCE})
        ON CONFLICT (month) DO NOTHING
        RETURNING quickchecker_ref, std_tolerance
      `
      settings = inserted[0] || { quickchecker_ref: DEFAULT_QUICKCHECKER_REF, std_tolerance: DEFAULT_STD_TOLERANCE }
    }

    const entryRows = await sql`
      SELECT id, entry_date, shift_group, entry_timestamp, values_json
      FROM entries
      WHERE month = ${month}
      ORDER BY entry_date ASC, shift_group ASC
    `

    res.status(200).json({
      month,
      quickchecker_ref: settings.quickchecker_ref,
      std_tolerance: settings.std_tolerance,
      entries: entryRows.map(rowToEntry),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to load month data' })
  }
}
