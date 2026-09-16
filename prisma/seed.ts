import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Limpiando base de datos...')
  await prisma.shift.deleteMany()
  await prisma.setting.deleteMany()
  await prisma.user.deleteMany()

  console.log('Creando configuraciones por defecto...')
  
  const defaultShiftTypes = [
    { id: 'TD_12', name: 'Turno Día 12h', time: '08:00 - 20:00', color: 'cyan', isNight: false },
    { id: 'TN_12', name: 'Turno Noche 12h', time: '20:00 - 08:00', color: 'purple', isNight: true },
    { id: 'TM_9', name: 'Turno Mañana 9h', time: '09:00 - 18:00', color: 'green', isNight: false }
  ]
  
  await prisma.setting.createMany({
    data: [
      { key: 'shift_types', value: JSON.stringify(defaultShiftTypes) }
    ]
  })

  console.log('Creando Super Admin...')
  const passwordHash = await bcrypt.hash('admin', 10)
  await prisma.user.create({
    data: {
      username: 'superadmin',
      name: 'Super Administrador',
      passwordHash,
      role: 'SUPER_ADMIN',
      defaultShift: 'TD_12',
      workDays: '{"1":"TD_12","2":"TD_12","3":"TD_12","4":"TD_12","5":"TD_12"}',
      level: 'Gerente',
      email: 'admin@soc.local',
      phone: ''
    }
  })

  console.log('Base de datos inicializada limpiamente. Solo existe el superadmin.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
