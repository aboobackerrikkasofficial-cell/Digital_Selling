import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const username = 'Aboobacker Rikkas'
  const password = '9188072646'
  
  const existing = await prisma.admin.findUnique({ where: { username } })
  if (existing) {
    console.log('Admin user already exists.')
    return
  }

  const salt = await bcrypt.genSalt(10)
  const passwordHash = await bcrypt.hash(password, salt)

  await prisma.admin.create({
    data: {
      username,
      password_hash: passwordHash
    }
  })

  console.log('Admin user seeded successfully!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
