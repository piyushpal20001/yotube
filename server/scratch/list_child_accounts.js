const { PrismaClient } = require('@prisma/client');
const { GoogleAdsApi } = require('google-ads-api');
const dotenv = require('dotenv');
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const token = await prisma.googleToken.findFirst();
  if (!token) {
    console.log('❌ No Google Token found in database.');
    return;
  }

  console.log('🔑 Found token.');
  const client = new GoogleAdsApi({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    developer_token: process.env.GOOGLE_DEVELOPER_TOKEN,
  });

  const managerCustomerId = '3453663749';

  try {
    console.log(`📡 Querying child accounts under manager ${managerCustomerId}...`);
    const customer = client.Customer({
      customer_id: managerCustomerId,
      refresh_token: token.refreshToken,
    });

    const result = await customer.query(`
      SELECT 
        customer_client.client_customer, 
        customer_client.descriptive_name, 
        customer_client.status,
        customer_client.level
      FROM customer_client
      WHERE customer_client.level = 1
    `);

    console.log('✅ Child Accounts:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Failed to list child accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
