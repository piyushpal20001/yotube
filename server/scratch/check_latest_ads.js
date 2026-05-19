const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ads = await prisma.ad.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log('📦 Last 5 Ads:', JSON.stringify(ads, null, 2));
}

main().finally(() => prisma.$disconnect());
