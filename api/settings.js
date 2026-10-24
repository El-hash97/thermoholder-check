import { sql, DEFAULT_STD_TOLERANCE } from './_db.js'

export const QUICKCHECKER_MIN = 500
export const QUICKCHECKER_MAX = 2000

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { month, quickchecker_ref } = req.body || {}
  const ref = Number(quickchecker_ref)
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    res.status(400).json({ error: 'month (YYYY-MM) is required' })
    return
  }
  if (!Number.isInteger(ref) || ref < QUICKCHECKER_MIN || ref > QUICKCHECKER_MAX) {
    res.status(400).json({ error: `quickchecker_ref must be a whole number from ${QUICKCHECKER_MIN} to ${QUICKCHECKER_MAX}` })
    return
  }

  try {
    const rows = await sql`
      INSERT INTO month_settings (month, quickchecker_ref, std_tolerance)
      VALUES (${month}, ${ref}, ${DEFAULT_STD_TOLERANCE})
      ON CONFLICT (month) DO UPDATE SET quickchecker_ref = EXCLUDED.quickchecker_ref
      RETURNING quickchecker_ref, std_tolerance
    `
    res.status(200).json({ month, ...rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to save settings' })
  }
}
