export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { getUserFromRequest } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getUserFromRequest(request)
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('csvFile') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 })
    }

    const text = await file.text()
    const rows = text.split('\n').map(row => row.trim()).filter(row => row.length > 0)

    if (rows.length < 2) {
      return NextResponse.json({ error: 'El archivo CSV está vacío o solo contiene encabezados.' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash("1234567890", 10)
    const defaultWorkDays = JSON.stringify({ "1": "MORNING", "2": "MORNING", "3": "MORNING", "4": "MORNING", "5": "MORNING" })
    const homeOfficeDays = JSON.stringify([])
    
    let createdCount = 0
    let errors: string[] = []

    // Omitimos la primera fila (encabezados)
    for (let i = 1; i < rows.length; i++) {
      // Divide por comas pero ignora las comas dentro de comillas
      const columns = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col.replace(/^"|"$/g, '').trim())
      
      if (columns.length < 2) continue

      const name = columns[0]
      const username = columns[1]
      const email = columns[2] || null
      const phone = columns[3] || null
      const level = columns[4] || 'N1'

      if (!name || !username) {
        errors.push(`Fila ${i + 1}: Faltan datos requeridos (nombre o usuario).`)
        continue
      }

      try {
        const existingUser = await prisma.user.findUnique({ where: { username } })
        if (existingUser) {
          errors.push(`Fila ${i + 1}: El usuario '${username}' ya existe.`)
          continue
        }

        await prisma.user.create({
          data: {
            username,
            name,
            passwordHash,
            role: 'AGENT',
            defaultShift: 'MORNING',
            workDays: defaultWorkDays,
            homeOfficeDays: homeOfficeDays,
            level: level,
            email: email,
            phone: phone,
          }
        })
        createdCount++
      } catch (err: any) {
        errors.push(`Fila ${i + 1}: Error al crear el usuario '${username}'. (${err.message})`)
      }
    }

    await prisma.auditLog.create({
      data: {
        actorId: session.id,
        action: 'CREATE_USERS_BULK',
        details: `Carga masiva: ${createdCount} usuarios creados. Errores: ${errors.length}`
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: `Se crearon ${createdCount} usuarios exitosamente.`,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Error procesando CSV:', error)
    return NextResponse.json({ error: 'Error interno al procesar el archivo CSV.' }, { status: 500 })
  }
}
