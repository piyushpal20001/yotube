const { enums } = require('google-ads-api');

console.log('--- AssetFieldType keys ---');
for (const key in enums.AssetFieldType) {
  if (isNaN(Number(key))) {
    console.log(`${key}: ${enums.AssetFieldType[key]}`);
  }
}
