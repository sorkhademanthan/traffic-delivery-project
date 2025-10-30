import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  // Only seed in development
  if (process.env.NODE_ENV === 'production') {
    console.log('⛔ Seeding skipped in production environment');
    process.exit(0);
  }

  console.log('🌱 Seeding database...');

  await prisma.$transaction(async (tx) => {
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await tx.user.upsert({
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

    // Create sample drivers with realistic data
    const drivers = [];
    for (let i = 0; i < 3; i++) {
      const driver = await tx.driver.upsert({
        where: { email: `driver${i + 1}@swiftroute.com` },
        update: {},
        create: {
          name: faker.person.fullName(),
          email: `driver${i + 1}@swiftroute.com`,
          phone: `+1${faker.string.numeric(10)}`,
          licenseNo: faker.string.alphanumeric(10).toUpperCase(),
          vehicleType: ['VAN', 'CAR', 'TRUCK'][i % 3] as any,
          status: 'AVAILABLE',
        },
      });
      drivers.push(driver);
      console.log(`✅ Created driver: ${driver.name}`);
    }

    // Create sample orders with realistic data
    const cities = ['New York', 'Brooklyn', 'Queens', 'Manhattan', 'Bronx'];
    const priorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
    
    for (let i = 1; i <= 10; i++) {
      const city = faker.helpers.arrayElement(cities);
      const lat = Number(faker.location.latitude({ min: 40.5, max: 41.0, precision: 7 }));
      const lon = Number(faker.location.longitude({ min: -74.5, max: -73.5, precision: 7 }));
      const price = Number(faker.commerce.price({ min: 20, max: 500, dec: 2 }));
      
      await tx.order.upsert({
        where: { orderNumber: `ORD-${String(i).padStart(3, '0')}` },
        update: {},
        create: {
          orderNumber: `ORD-${String(i).padStart(3, '0')}`,
          customerName: faker.person.fullName(),
          customerPhone: `+1${faker.string.numeric(10)}`,
          customerEmail: faker.internet.email(),
          address: faker.location.streetAddress(),
          addressLine2: faker.helpers.maybe(() => faker.location.secondaryAddress(), { probability: 0.3 }),
          city: city,
          postalCode: faker.location.zipCode('#####'),
          latitude: lat,
          longitude: lon,
          deliveryNotes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.5 }),
          orderValue: price,
          priority: faker.helpers.arrayElement(priorities) as any,
          timeWindow: faker.helpers.arrayElement(['09:00-12:00', '12:00-15:00', '15:00-18:00']),
          status: 'PENDING',
        },
      });
    }
    console.log('✅ Created 10 sample orders');
  });

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });