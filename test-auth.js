const http = require('http');

async function testRegister() {
  const data = JSON.stringify({
    name: 'TestFresh',
    email: `fresh-${Date.now()}@test.com`,
    password: '123456',
    role: 'admin'
  });
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };
  
  const req = http.request(options, (res) => {
    let responseData = '';
    res.on('data', chunk => responseData += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      try {
        const parsed = JSON.parse(responseData);
        console.log('Response:', parsed);
      } catch (e) {
        console.log('Raw response:', responseData);
      }
    });
  });
  
  req.on('error', (e) => console.error('Error:', e));
  req.write(data);
  req.end();
}

testRegister().catch(console.error);

