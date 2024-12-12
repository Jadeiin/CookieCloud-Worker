# CookieCloud Worker

A Cloudflare Worker implementation of CookieCloud server for storing and retrieving encrypted cookie data. This worker provides a simple key-value storage system with automatic expiration for managing encrypted browser cookies.

## Features

- Store and retrieve encrypted cookie data
- Automatic data expiration (default: 1 week)
- CORS support for cross-origin requests
- Gzip compression support for requests
- Simple statistics endpoint
- Built on Cloudflare Workers and KV storage

## Setup

1. Install Wrangler CLI:
```bash
npm install -g wrangler
```

2. Configure your `wrangler.toml`:
```toml
name = "cookie-cloud"
main = "index.js"
compatibility_date = "2023-01-01"

kv_namespaces = [
  { binding = "KV", id = "YOUR_KV_ID_HERE" }
]
```

3. Create a KV namespace:
```bash
wrangler kv:namespace create "KV"
```

4. Update your `wrangler.toml` with the KV namespace ID from the previous step.

5. Deploy the worker:
```bash
wrangler deploy
```

## API Endpoints

### GET /
Returns service statistics.

**Response:**
```json
{
  "total_users": 42,
  "status": "running",
  "version": "1.0.0"
}
```

### POST /update
Store encrypted cookie data.

**Request Body:**
```json
{
  "uuid": "user-unique-id",
  "encrypted": "encrypted-data-string",
  "expiration": 3600  // optional, seconds until expiration
}
```

**Response:**
```json
{
  "action": "done",
  "expiration": 604800  // seconds until expiration
}
```

### GET /get/:uuid
Retrieve stored cookie data.

**Parameters:**
- `uuid`: Unique identifier for the stored data

**Response:**
```json
{
  "encrypted": "stored-encrypted-data"
}
```

## Error Responses

- `400 Bad Request`: Missing required fields
- `404 Not Found`: Data not found for given UUID
- `500 Internal Error`: Server error

## CORS Support

The API supports Cross-Origin Resource Sharing (CORS) with the following headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Content-Encoding`

## Data Expiration

- Default expiration time: 7 days
- Custom expiration can be set in seconds using the `expiration` field in the update request
- Data is automatically removed after expiration

## Compression

- Supports gzipped request bodies (Content-Encoding: gzip)
- Responses are automatically compressed by Cloudflare Workers when appropriate

## Security Notes

- All data should be encrypted on the client side before sending
- The server stores data as-is without additional encryption
- Do not share encrypted data or UUIDs with untrusted parties
- Consider using short expiration times for sensitive data

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.