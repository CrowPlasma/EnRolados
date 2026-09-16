export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { signToken } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Faltan credenciales' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash)

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    if (password === '1234567890') {
      const tempToken = signToken({
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        isTemp: true
      })
      return NextResponse.json({
        requiresPasswordChange: true,
        tempToken,
        user: { id: user.id, username: user.username, name: user.name, role: user.role }
      })
    }

    const token = signToken({
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name
    })

    const response = NextResponse.json({
      message: 'Login exitoso',
      user: { id: user.id, username: user.username, role: user.role, name: user.name }
    })

    // Set cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: false, // Disabling secure to allow login over HTTP on local network
      maxAge: 60 * 60 * 12 // 12 hours
    })

    return response
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
