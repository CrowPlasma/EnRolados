export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ message: 'Logout exitoso' })
  response.cookies.delete('auth_token')
  return response
}
