addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

// Decompress gzipped request body
async function decompressBody(request) {
  const contentEncoding = request.headers.get('content-encoding')
  if (contentEncoding === 'gzip') {
    const decompressedStream = request.body.pipeThrough(new DecompressionStream('gzip'))
    const decompressedResponse = new Response(decompressedStream)
    return await decompressedResponse.json()
  }
  return await request.json()
}

async function getStatistics() {
  let count = 0
  let cursor = undefined
  do {
    const list = await KV.list({ cursor, limit: 1000 })
    count += list.keys.length
    cursor = list.cursor
  } while (cursor)
  return count
}

async function handleRequest(request) {
  const url = new URL(request.url)
  const { pathname } = url

  // Add CORS headers to all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Content-Encoding',
    'Access-Control-Expose-Headers': 'Content-Encoding',
  }

  // Handle OPTIONS request for CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    })
  }

  // Handle root path
  if (pathname === '/' || pathname === '') {
    const totalKeys = await getStatistics()
    const stats = {
      total_users: totalKeys,
      status: 'running',
      version: '1.0.0'
    }
    
    return new Response(JSON.stringify(stats, null, 2), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }

  // Handle update endpoint
  if (pathname === '/update' && request.method === 'POST') {
    try {
      const { encrypted, uuid, expiration } = await decompressBody(request)
      
      if (!encrypted || !uuid) {
        return new Response('Bad Request', { 
          status: 400,
          headers: corsHeaders
        })
      }

      // Default expiration is 1 week (7 days)
      const expirationTtl = expiration ? parseInt(expiration) : 7 * 24 * 60 * 60

      // Store encrypted content directly with expiration
      await KV.put(uuid, encrypted, { expirationTtl })
      
      return new Response(JSON.stringify({ 
        "action": "done",
        "expiration": expirationTtl
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      })
    } catch (error) {
      return new Response(JSON.stringify({ "action": "error" }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      })
    }
  }

  // Handle get endpoint
  if (pathname.startsWith('/get/')) {
    const uuid = pathname.split('/get/')[1]
    
    if (!uuid) {
      return new Response('Bad Request', { 
        status: 400,
        headers: corsHeaders
      })
    }

    const stored = await KV.get(uuid)
    if (!stored) {
      return new Response('Not Found', { 
        status: 404,
        headers: corsHeaders
      })
    }

    // Return stored content directly
    return new Response(JSON.stringify({ "encrypted": stored }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }

  return new Response('Not Found', { 
    status: 404,
    headers: corsHeaders
  })
} 