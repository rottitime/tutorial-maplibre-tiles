import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { Readable } from 'node:stream'
import path from 'node:path'

export const runtime = 'nodejs'

export async function GET() {
  const filePath = path.join(process.cwd(), 'src/data/raw/RhodeIsland.geojson')
  const { size } = await stat(filePath)
  const stream = Readable.toWeb(createReadStream(filePath))

  return new Response(stream as BodyInit, {
    headers: {
      'Content-Type': 'application/geo+json',
      'Content-Length': String(size),
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
