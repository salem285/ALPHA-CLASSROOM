import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const defaultPassword = 'Alpha@2026!';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const defaultUsers = [
    {
      email: 'admin@alphacoding.com',
      firstName: 'Alpha',
      lastName: 'SuperAdmin',
      role: UserRole.SUPER_ADMIN,
      isApproved: true,
    },
    {
      email: 'instructor@alphacoding.com',
      firstName: 'Alex',
      lastName: 'Instructor',
      role: UserRole.INSTRUCTOR,
      isApproved: true,
    },
    {
      email: 'student@alphacoding.com',
      firstName: 'Sam',
      lastName: 'Student',
      role: UserRole.STUDENT,
      isApproved: true,
    },
  ];

  for (const u of defaultUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        password: hashedPassword,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        isApproved: true,
      },
      create: {
        email: u.email,
        password: hashedPassword,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        isApproved: true,
      },
    });
  }

  // Also update password for any existing super admin, instructor, or student accounts
  await prisma.user.updateMany({
    where: { email: { in: ['admin@alphacoding.com', 'instructor@alphacoding.com', 'student@alphacoding.com'] } },
    data: { password: hashedPassword, isApproved: true },
  });

  const asciiTable = `
========================================================================================
                             ALPHA CLASSROOM CREDENTIALS
========================================================================================
+---------------+---------------------+-----------------------------+-------------------+
| Role          | Name                | Email                       | Password          |
+---------------+---------------------+-----------------------------+-------------------+
| SUPER_ADMIN   | Alpha SuperAdmin    | admin@alphacoding.com       | Alpha@2026!       |
| INSTRUCTOR    | Alex Instructor     | instructor@alphacoding.com  | Alpha@2026!       |
| STUDENT       | Sam Student         | student@alphacoding.com     | Alpha@2026!       |
+---------------+---------------------+-----------------------------+-------------------+
========================================================================================
All accounts are active, verified, and pre-approved for immediate sign-in.
`;

  console.log(asciiTable);
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
