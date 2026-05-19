const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const adGroups = await prisma.adGroup.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log('📦 Last 5 Ad Groups:', JSON.stringify(adGroups, null, 2));

  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  const formattedCampaigns = campaigns.map(c => ({
    ...c,
    budgetMicros: c.budgetMicros.toString()
  }));
  console.log('📢 Last 5 Campaigns:', JSON.stringify(formattedCampaigns, null, 2));
}

main().finally(() => prisma.$disconnect());
