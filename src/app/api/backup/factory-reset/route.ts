export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function POST(request: Request) {
  try {
    const userPayload = await getUserFromRequest(request)
    if (!userPayload || userPayload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No autorizado. Solo Super Administradores pueden hacer un Factory Reset.' }, { status: 403 })
    }

    // 1. Borrar todas las tablas principales
    await prisma.shift.deleteMany()
    await prisma.absence.deleteMany()
    await prisma.auditLog.deleteMany()
    await prisma.setting.deleteMany()
    
    // 2. Borrar absolutamente todos los usuarios
    await prisma.user.deleteMany()

    // 3. Recrear el usuario admin por defecto
    const hashedPassword = await bcrypt.hash('admin', 10)
    await prisma.user.create({
      data: {
        username: 'admin',
        passwordHash: hashedPassword,
        name: 'Super Administrador',
        role: 'SUPER_ADMIN',
        level: 'N1',
        workDays: JSON.stringify({}),
        homeOfficeDays: '[]',
        email: '',
        phone: ''
      }
    })

    // Reiniciar contenedor para limpiar caché y reconectar
    setTimeout(() => {
      console.log('Reiniciando el sistema por Factory Reset...')
      process.exit(0)
    }, 1500)

    return NextResponse.json({ success: true, message: 'Sistema restablecido de fábrica. Reiniciando...' })
  } catch (error) {
    console.error('Error al hacer factory reset:', error)
    return NextResponse.json({ error: 'Error interno al restablecer la base de datos.' }, { status: 500 })
  }
}
