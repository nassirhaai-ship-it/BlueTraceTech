require('dotenv').config({path: '.env.local'});
const { MongoClient } = require('mongodb');

async function run() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db();
  
  const res1 = await db.collection('ventes').updateMany({}, { $set: { certificatGenere: false } });
  console.log('Update Ventes:', res1.modifiedCount);
  
  const res2 = await db.collection('lots').updateMany({}, { $set: { qrCodeGenere: false } });
  console.log('Update Lots:', res2.modifiedCount);
  
  process.exit(0);
}

run();
