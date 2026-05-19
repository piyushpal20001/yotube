const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('❌ No user found.');
    return;
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
  
  const campaign = await prisma.campaign.findFirst({
    where: { googleCampaignId: { contains: '23862119998' } } // piyush pal campaign
  });

  const payload = {
    customerId: '207-605-8042',
    campaignResourceName: 'customers/2076058042/campaigns/23862119998',
    name: `Test Group API - ${Date.now()}`
  };

  try {
    console.log('📡 Sending POST request to http://localhost:5000/api/google-ads/ad-groups...');
    const response = await axios.post('http://localhost:5000/api/google-ads/ad-groups', payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Response Status:', response.status);
    console.log('✅ Response Body:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Request Failed!');
    if (error.response) {
      console.error('❌ Status Code:', error.response.status);
      console.error('❌ Response Body:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('❌ Error Message:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
