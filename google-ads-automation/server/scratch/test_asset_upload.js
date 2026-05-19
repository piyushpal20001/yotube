const { PrismaClient } = require('@prisma/client');
const { GoogleAdsApi, enums } = require('google-ads-api');
const fs = require('fs');
const path = require('path');
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

    // Read a smaller image file from uploads (e.g. 1779094612876-195576477.jpg)
    const imgPath = path.join(__dirname, '../uploads/1779094612876-195576477.jpg');
    if (!fs.existsSync(imgPath)) {
      console.log('❌ Image file not found:', imgPath);
      return;
    }

    const imgBuffer = fs.readFileSync(imgPath);
    const base64Data = imgBuffer.toString('base64');

    console.log('📡 Uploading image asset to Google Ads...');
    const assetResponse = await customer.assets.create([
      {
        name: `Bike Image Asset - ${Date.now()}`,
        type: enums.AssetType.IMAGE,
        image_asset: {
          data: base64Data,
        },
      },
    ]);

    const assetResourceName = assetResponse.results[0].resource_name;
    console.log('✅ Image Asset Uploaded:', assetResourceName);

    console.log('📡 Linking Image Asset to Campaign duniya...');
    const linkResponse = await customer.campaignAssets.create([
      {
        campaign: campaignResourceName,
        asset: assetResourceName,
        field_type: enums.AssetFieldType.AD_IMAGE,
      },
    ]);

    console.log('✅ Success Link:', linkResponse.results[0].resource_name);
  } catch (error) {
    console.error('❌ Error Details:', JSON.stringify(error, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main();
