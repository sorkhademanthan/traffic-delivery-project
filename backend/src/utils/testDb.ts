import prisma from '../config/database';

export async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    const userCount = await prisma.user.count();
    const orderCount = await prisma.order.count();
    const driverCount = await prisma.driver.count();
    
    console.log(`📊 Database stats:`);
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Orders: ${orderCount}`);
    console.log(`   - Drivers: ${driverCount}`);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}
