import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedExtras() {
  console.log('--- Generando datos adicionales (Ausencias y Auditoría) ---')

  const users = await prisma.user.findMany()
  const admin = users.find(u => u.role === 'SUPER_ADMIN') || users[0]
  const agents = users.filter(u => u.role === 'AGENT')

  if (agents.length === 0) {
    console.log('No hay agentes para asignar ausencias.')
    return
  }

  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

  // 1. Crear Ausencias
  const absencesData = [
    {
      userId: agents[0].id, // Carlos Mendoza (probablemente)
      startDate: new Date(year, month, 5),
      endDate: new Date(year, month, 12),
      type: 'VACATION'
    },
    {
      userId: agents[2].id, 
      startDate: new Date(year, month, 15),
      endDate: new Date(year, month, 16),
      type: 'SICK_LEAVE'
    },
    {
      userId: agents[5].id, 
      startDate: new Date(year, month, 20),
      endDate: new Date(year, month, 20),
      type: 'OTHER'
    }
  ]

  for (const abs of absencesData) {
    await prisma.absence.create({ data: abs })
  }
  console.log('Ausencias de prueba creadas.')

  // 2. Crear Registros de Auditoría simulados con diferentes fechas recientes
  const auditLogsData = [
    {
      actorId: admin.id,
      action: 'LOGIN',
      details: 'Inicio de sesión exitoso desde IP 192.168.1.5',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48) // hace 2 días
    },
    {
      actorId: admin.id,
      action: 'UPDATE_USER',
      details: `Rol modificado para el usuario: ${agents[0].name}`,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) // hace 1 día
    },
    {
      actorId: admin.id,
      action: 'BULK_GENERATE_SHIFTS',
      details: `Turnos generados para el mes ${month + 1}/${year}`,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // hace 2 horas
    },
    {
      actorId: admin.id,
      action: 'CREATE_ABSENCE',
      details: `Incapacidad médica registrada para ${agents[2].name}`,
      createdAt: new Date(Date.now() - 1000 * 60 * 15) // hace 15 min
    },
    {
      actorId: admin.id,
      action: 'DELETE_SHIFT',
      details: `Eliminación manual del turno de ${agents[5].name} el día 20`,
      createdAt: new Date() // ahora
    }
  ]

  for (const log of auditLogsData) {
    await prisma.auditLog.create({ data: log })
  }
  console.log('Logs de auditoría de prueba creados.')

  // Opcionalmente, podemos borrar los turnos de las personas que tienen vacaciones/incapacidad
  // para que coincida lógicamente
  for (const abs of absencesData) {
    await prisma.shift.deleteMany({
      where: {
        userId: abs.userId,
        date: {
          gte: abs.startDate,
          lte: abs.endDate
        }
      }
    })
  }
  console.log('Turnos solapados con ausencias han sido limpiados.')
}

seedExtras()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
