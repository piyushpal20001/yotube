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

  try {
    console.log('📡 Calling listAccessibleCustomers...');
    const accounts = await client.listAccessibleCustomers(token.refreshToken);
    console.log('✅ Accessible Accounts:', JSON.stringify(accounts, null, 2));
  } catch (error) {
    console.error('❌ Failed to list accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
