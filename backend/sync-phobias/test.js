// Test local
const handler = require('./index').handler;

async function test() {
  console.log('Testing sync...');
  const result = await handler({}, {});
  console.log('Result:', result);
}

test();
