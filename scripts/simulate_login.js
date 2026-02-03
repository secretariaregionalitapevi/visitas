const http = require('http');
const querystring = require('querystring');

const postData = querystring.stringify({
  email: 'ricardograngeiro@gmail.com',
  password: 'admin123'
});

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/restrito/acesso',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log('STATUS:', res.statusCode);
  console.log('HEADERS:', res.headers);
  const setCookie = res.headers['set-cookie'];
  let body = '';
  res.on('data', (chunk) => body += chunk.toString());
  res.on('end', () => {
    console.log('BODY LENGTH', body.length);
    if (setCookie && setCookie.length) {
      // use first cookie and perform GET
      const cookie = setCookie.map(c => c.split(';')[0]).join('; ');
      const getOptions = {
        hostname: '127.0.0.1',
        port: 3000,
        path: '/restrito/graficos',
        method: 'GET',
        headers: { 'Cookie': cookie }
      };
      const getReq = http.request(getOptions, (getRes) => {
        console.log('GET STATUS', getRes.statusCode);
        let r = '';
        getRes.on('data', c=> r+=c.toString());
        getRes.on('end', ()=>{
          console.log('GET len', r.length);
          console.log(r.slice(0,500));
        });
      });
      getReq.on('error', e=> console.error('GET error', e));
      getReq.end();
    } else {
      console.log('No set-cookie returned; session likely not set.');
      console.log(body.slice(0,500));
    }
  });
});

req.on('error', (e) => {
  console.error('problem with request:', e.message);
});

req.write(postData);
req.end();
