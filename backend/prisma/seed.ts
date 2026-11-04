import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const superAdminEmail = 'admin@alphacoding.com';
  const rawPassword = 'AdminPassword123!';
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {
      role: UserRole.SUPER_ADMIN,
      isApproved: true,
    },
    create: {
      email: superAdminEmail,
      password: hashedPassword,
      firstName: 'Alpha',
      lastName: 'SuperAdmin',
      role: UserRole.SUPER_ADMIN,
      isApproved: true,
    },
  });

  console.log('Seeding completed successfully!');
  console.log(`Default Super Admin: ${superAdmin.email}`);
  console.log(`Role: ${superAdmin.role}, isApproved: ${superAdmin.isApproved}`);
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
