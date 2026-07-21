import { neon } from '@neondatabase/serverless'

export const sql = neon(process.env.DATABASE_URL)

export const DEFAULT_QUICKCHECKER_REF = 1500
export const DEFAULT_STD_TOLERANCE = 5

export function rowToEntry(row) {
  return {
    id: row.id,
    date: row.entry_date,
    group: row.shift_group,
    timestamp: row.entry_timestamp instanceof Date ? row.entry_timestamp.toISOString() : row.entry_timestamp,
    values: row.values_json,
  }
}
