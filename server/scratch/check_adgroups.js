const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const adGroups = await prisma.adGroup.findMany();
  console.log('📦 Ad Groups:', JSON.stringify(adGroups, null, 2));
}

main().finally(() => prisma.$disconnect());
