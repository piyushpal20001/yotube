const { PrismaClient } = require('@prisma/client');
const { GoogleAdsApi, enums } = require('google-ads-api');
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
  const campaignResourceName = 'customers/2076058042/campaigns/23852435916'; // duniya campaign

  try {
    const customer = client.Customer({
      customer_id: customerId,
      refresh_token: token.refreshToken,
      login_customer_id: '3453663749',
    });

    console.log('📡 Trying to create Ad Group under campaign duniya...');
    const adGroupName = `Test Group - ${Date.now()}`;
    const response = await customer.adGroups.create([
      {
        name: adGroupName,
        campaign: campaignResourceName,
        status: enums.AdGroupStatus.ENABLED,
        type: enums.AdGroupType.SEARCH_STANDARD,
      },
    ]);
    console.log('✅ Success:', response.results[0].resource_name);
  } catch (error) {
    console.error('❌ Error Details:', JSON.stringify(error, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main();
