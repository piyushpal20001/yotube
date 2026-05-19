const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const campaigns = await prisma.campaign.findMany();
  const formatted = campaigns.map(c => ({
    ...c,
    budgetMicros: c.budgetMicros.toString()
  }));
  console.log('📢 Campaigns:', JSON.stringify(formatted, null, 2));
}

main().finally(() => prisma.$disconnect());
