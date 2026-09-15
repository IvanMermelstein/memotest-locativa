export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { GoogleSpreadsheet } from 'google-spreadsheet'
import { JWT } from 'google-auth-library'

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!
const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL!
const key = process.env.GOOGLE_SHEETS_PRIVATE_KEY!.replace(/\\n/g, '\n')

// Reused across requests on a warm server instance so each call doesn't
// redo the JWT handshake + loadInfo() round trip to Google Sheets — that
// was adding noticeable latency to both saving a score and loading the
// ranking. The JWT client refreshes its own token internally, so reusing
// it is safe.
let sheetPromise: ReturnType<typeof loadSheet> | null = null

async function loadSheet() {
  const jwt = new JWT({ email, key, scopes: ['https://www.googleapis.com/auth/spreadsheets'] })
  const doc = new GoogleSpreadsheet(SPREADSHEET_ID, jwt)
  await doc.loadInfo()
  return doc.sheetsByIndex[0]
}

async function initDoc() {
  if (!sheetPromise) {
    sheetPromise = loadSheet().catch((err) => {
      sheetPromise = null
      throw err
    })
  }
  return sheetPromise
}

// Short-lived cache so repeated ranking loads (e.g. several players checking
// it around the same time) don't each trigger a full getRows() round trip
// to Google Sheets. Invalidated immediately on a new score so the board
// stays accurate right after someone submits.
const RANKING_CACHE_TTL_MS = 15_000
let rankingCache: { data: unknown[]; expiresAt: number } | null = null

export async function POST(req: Request) {
  const { firstName, lastName, phone, moves, time, valid } = await req.json()
  if (!firstName || !lastName || moves == null || time == null)
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })

  const sheet = await initDoc()
  await sheet.addRow({ firstName, lastName, phone, moves, time, valid, createdAt: new Date().toISOString() })
  rankingCache = null
  return NextResponse.json({ success: true }, { status: 201 })
}

export async function GET() {
  if (rankingCache && rankingCache.expiresAt > Date.now()) {
    return NextResponse.json(rankingCache.data)
  }

  const sheet = await initDoc()
  const rows = await sheet.getRows()
  const scores = rows
    // Una partida perdida (tiempo agotado) se guarda igual, pero queda
    // marcada como no válida (columna "valid") y no entra al ranking. Las
    // filas viejas (sin esa columna todavía) se siguen contando como antes.
    .filter(row => String((row.toObject() as Record<string, string>).valid).toLowerCase() !== 'false')
    .map(row => {
      const rec = row.toObject() as Record<string, string>
      return {
        firstName: rec.firstName,
        lastName: rec.lastName,
        phone: rec.phone,
        moves: Number(rec.moves),
        time: Number(rec.time),
        createdAt: rec.createdAt
      }
    })
  scores.sort((a, b) => a.moves - b.moves || a.time - b.time)
  rankingCache = { data: scores, expiresAt: Date.now() + RANKING_CACHE_TTL_MS }
  return NextResponse.json(scores)
}
