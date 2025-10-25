// filepath: backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@swiftroute.com' },
    update: {},
    create: {
      email: 'admin@swiftroute.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create sample drivers
  const driver1 = await prisma.driver.upsert({
    where: { email: 'driver1@swiftroute.com' },
    update: {},
    create: {
      name: 'John Driver',
      email: 'driver1@swiftroute.com',
      phone: '+1234567890',
      vehicleType: 'VAN',
      status: 'AVAILABLE',
    },
  });

  const driver2 = await prisma.driver.upsert({
    where: { email: 'driver2@swiftroute.com' },
    update: {},
    create: {
      name: 'Jane Wheeler',
      email: 'driver2@swiftroute.com',
      phone: '+1234567891',
      vehicleType: 'CAR',
      status: 'AVAILABLE',
    },
  });
  console.log('✅ Created drivers:', driver1.name, driver2.name);

  // Create sample orders
  const sampleOrders = [
    {
      orderNumber: 'ORD-001',
      customerName: 'Alice Johnson',
      customerPhone: '+1234567800',
      address: '123 Main St',
      city: 'New York',
      postalCode: '10001',
      priority: 'NORMAL' as const,
    },
    {
      orderNumber: 'ORD-002',
      customerName: 'Bob Smith',
      customerPhone: '+1234567801',
      address: '456 Oak Ave',
      city: 'New York',
      postalCode: '10002',
      priority: 'HIGH' as const,
    },
  ];

  for (const orderData of sampleOrders) {
    await prisma.order.upsert({
      where: { orderNumber: orderData.orderNumber },
      update: {},
      create: orderData,
    });
  }
  console.log(`✅ Created ${sampleOrders.length} sample orders`);

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    (globalThis as any).process?.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
