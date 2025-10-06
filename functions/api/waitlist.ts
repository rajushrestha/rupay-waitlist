export const onRequest = async ({ request, env }: { request: Request; env: Record<string, string> }) => {
  const accountId = env.CLOUDFLARE_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID
  const databaseId = env.CLOUDFLARE_DATABASE_ID || process.env.CLOUDFLARE_DATABASE_ID
  const apiToken = env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN

  if (!accountId || !databaseId || !apiToken) {
    return new Response(
      JSON.stringify({ error: 'Cloudflare credentials not configured' }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    )
  }

  async function d1(sql: string, params?: unknown[]) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query` as const
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data?.errors?.[0]?.message || 'D1 query failed')
    }
    return data
  }

  try {
    if (request.method === 'POST') {
      const { email } = await request.json().catch(() => ({ email: '' }))
      if (typeof email !== 'string' || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return new Response(JSON.stringify({ error: 'Invalid email' }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        })
      }

      // Ensure table exists
      await d1(
        'CREATE TABLE IF NOT EXISTS waitlist (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);',
      )
      // Insert (ignore duplicates)
      await d1('INSERT OR IGNORE INTO waitlist (email) VALUES (?);', [email])
      // Return count
      const countRes = await d1('SELECT COUNT(*) AS c FROM waitlist;')
      const count = Number(countRes.result?.[0]?.results?.[0]?.c ?? 0)
      return new Response(JSON.stringify({ ok: true, count }), {
        headers: { 'content-type': 'application/json' },
      })
    }

    if (request.method === 'GET') {
      await d1(
        'CREATE TABLE IF NOT EXISTS waitlist (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);',
      )
      const countRes = await d1('SELECT COUNT(*) AS c FROM waitlist;')
      const count = Number(countRes.result?.[0]?.results?.[0]?.c ?? 0)
      return new Response(JSON.stringify({ count }), {
        headers: { 'content-type': 'application/json' },
      })
    }

    return new Response('Method Not Allowed', { status: 405 })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Server error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
}
