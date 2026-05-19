import { PrismaClient } from '@prisma/client';
import { googleAdsService } from '../src/services/googleAds.service';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const token = await prisma.googleToken.findFirst();
  if (!token) {
    console.log('❌ No Google Token found in database.');
    return;
  }

  console.log('🔑 Found token. Refresh token:', token.refreshToken);
  try {
    console.log('📡 Calling listAccessibleCustomers...');
    const accounts = await googleAdsService.listAccessibleCustomers(token.refreshToken);
    console.log('✅ Accessible Accounts:', JSON.stringify(accounts, null, 2));
  } catch (error) {
    console.error('❌ Failed to list accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
