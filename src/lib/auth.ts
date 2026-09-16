import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret'

export function signToken(payload: any) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' })
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as any
  } catch (error) {
    return null
  }
}

export async function getUserFromRequest(request: Request) {
  const cookieHeader = request.headers.get('cookie') || ''
  
  // Parse cookies safely - JWT tokens contain '=' so we split only on the FIRST '='
  const token = cookieHeader
    .split('; ')
    .map(c => {
      const idx = c.indexOf('=')
      if (idx === -1) return null
      return { key: c.slice(0, idx), value: c.slice(idx + 1) }
    })
    .filter(Boolean)
    .find(c => c!.key === 'auth_token')
    ?.value

  console.log('[Auth] Cookie header present:', !!cookieHeader)
  console.log('[Auth] Token found:', token ? 'YES' : 'NO')

  if (!token) return null
  const result = verifyToken(token)
  console.log('[Auth] Token valid:', result ? 'YES' : 'NO')
  return result
}
