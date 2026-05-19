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

  try {
    const customer = client.Customer({
      customer_id: customerId,
      refresh_token: token.refreshToken,
      login_customer_id: '3453663749',
    });

    console.log('📡 1. Creating budget with 500 INR (500000000 micros)...');
    const budgetResponse = await customer.campaignBudgets.create([
      {
        name: `Test Budget - 500 INR - ${Date.now()}`,
        amount_micros: 500000000, 
        delivery_method: enums.BudgetDeliveryMethod.STANDARD,
      },
    ]);
    const budgetResourceName = budgetResponse.results[0].resource_name;
    console.log('✅ Budget created:', budgetResourceName);

    console.log('📡 2. Creating campaign under this budget with manual_cpc and contains_eu_political_advertising: DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING...');
    const campaignResponse = await customer.campaigns.create([
      {
        name: `Test Campaign - 500 INR - ${Date.now()}`,
        advertising_channel_type: enums.AdvertisingChannelType.SEARCH,
        status: enums.CampaignStatus.PAUSED,
        campaign_budget: budgetResourceName,
        manual_cpc: {}, 
        contains_eu_political_advertising: 'DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING', // String Enum Value
        network_settings: {
          target_google_search: true,
          target_search_network: true,
          target_content_network: false,
          target_partner_search_network: false,
        },
      },
    ]);
    console.log('✅ Campaign created:', campaignResponse.results[0].resource_name);
  } catch (error) {
    console.error('❌ Detailed Error:', JSON.stringify(error, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main();
