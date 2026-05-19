const { enums } = require('google-ads-api');

console.log('--- AdvertisingChannelType ---');
for (const key in enums.AdvertisingChannelType) {
  if (isNaN(Number(key))) {
    console.log(`${key}: ${enums.AdvertisingChannelType[key]}`);
  }
}

console.log('\n--- AdGroupType ---');
for (const key in enums.AdGroupType) {
  if (isNaN(Number(key))) {
    console.log(`${key}: ${enums.AdGroupType[key]}`);
  }
}
