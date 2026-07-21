import http from 'node:http'
import { config } from 'dotenv'

config()

const PORT = 3001
const handlers = {
  month: (await import('../api/month.js')).default,
  entry: (await import('../api/entry.js')).default,
  reset: (await import('../api/reset.js')).default,
  months: (await import('../api/months.js')).default,
}

function buildRes(res) {
  return {
    status(code) {
      res.statusCode = code
      return this
    },
    json(payload) {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(payload))
    },
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const name = url.pathname.replace(/^\/api\//, '')
  const handler = handlers[name]

  if (!handler) {
    res.statusCode = 404
    res.end('Not found')
    return
  }

  let body = ''
  req.on('data', chunk => { body += chunk })
  req.on('end', async () => {
    const fakeReq = {
      method: req.method,
      query: Object.fromEntries(url.searchParams),
      body: body ? JSON.parse(body) : undefined,
    }
    try {
      await handler(fakeReq, buildRes(res))
    } catch (err) {
      console.error(err)
      res.statusCode = 500
      res.end(JSON.stringify({ error: 'Internal error' }))
    }
  })
})

server.listen(PORT, () => {
  console.log(`Local API dev server listening on http://localhost:${PORT}`)
})
