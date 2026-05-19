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
  const campaignResourceName = 'customers/2076058042/campaigns/23862119998'; // piyush pal campaign

  try {
    const customer = client.Customer({
      customer_id: customerId,
      refresh_token: token.refreshToken,
      login_customer_id: '3453663749',
    });

    console.log('📡 1. Creating a new Ad Group under piyush pal...');
    const adGroupName = `Piyush Ad Group - ${Date.now()}`;
    const adGroupResponse = await customer.adGroups.create([
      {
        name: adGroupName,
        campaign: campaignResourceName,
        status: enums.AdGroupStatus.ENABLED,
        type: enums.AdGroupType.SEARCH_STANDARD,
      },
    ]);
    const adGroupResourceName = adGroupResponse.results[0].resource_name;
    console.log('✅ Ad Group created successfully:', adGroupResourceName);

    console.log('📡 2. Creating Responsive Search Ad under piyush pal...');
    const adResponse = await customer.adGroupAds.create([
      {
        ad_group: adGroupResourceName,
        status: enums.AdGroupAdStatus.ENABLED,
        ad: {
          final_urls: ['http://www.example.com'],
          responsive_search_ad: {
            headlines: [
              { text: 'Buy Best Bikes' },
              { text: 'Top Quality Cycles' },
              { text: 'Super Fast Delivery' }
            ],
            descriptions: [
              { text: 'Best bikes in the city' },
              { text: 'Quality assurance and fast delivery' }
            ],
          },
        },
      },
    ]);

    console.log('✅ Ad created successfully:', adResponse.results[0].resource_name);
  } catch (error) {
    console.error('❌ Detailed Error:', JSON.stringify(error, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main();
