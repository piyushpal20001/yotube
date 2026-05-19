const { PrismaClient } = require('@prisma/client');
const { GoogleAdsApi } = require('google-ads-api');
const dotenv = require('dotenv');
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const token = await prisma.googleToken.findFirst();
  if (!token) {
    console.log('❌ No Google Token found.');
    return;
  }

  const client = new GoogleAdsApi({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    developer_token: process.env.GOOGLE_DEVELOPER_TOKEN,
  });

  const customerId = '2076058042';

  try {
    const customer = client.Customer({
      customer_id: customerId,
      refresh_token: token.refreshToken,
      login_customer_id: '3453663749',
    });

    console.log('📡 Fetching all Campaign Assets for account...');
    const campaignAssets = await customer.report({
      entity: 'campaign_asset',
      attributes: [
        'campaign_asset.campaign',
        'campaign_asset.asset',
        'campaign_asset.field_type',
        'campaign_asset.status'
      ],
      limit: 10
    });
    console.log('📦 Campaign Assets:', JSON.stringify(campaignAssets, null, 2));

    console.log('📡 Fetching all general Assets...');
    const assets = await customer.report({
      entity: 'asset',
      attributes: [
        'asset.id',
        'asset.name',
        'asset.type',
        'asset.image_asset.mime_type'
      ],
      limit: 10
    });
    console.log('📦 General Assets:', JSON.stringify(assets, null, 2));
  } catch (error) {
    console.error('❌ Error Details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
