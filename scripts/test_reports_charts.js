require('dotenv').config();
const visitService = require('../src/services/visits');
const dbConfig = require('../src/config/dbConfig');
const conn = dbConfig.connection();

async function main(){
  try{
    const email = process.env.TEST_USER_EMAIL || 'ricardograngeiro@gmail.com';
    // try find user by email
    const [userRows] = await conn.query('SELECT id, email, username FROM users WHERE email = $1 LIMIT 1', [email]);
    let user = null;
    if (userRows && userRows.length) user = userRows[0];
    else {
      const [all] = await conn.query('SELECT id, email, username FROM users LIMIT 1');
      user = all && all.length ? all[0] : null;
    }

    if (!user) {
      console.error('No users found in database to test with.');
      process.exit(1);
    }

    const app = { connection: conn, regional: { name: 'TEST' } };
    const userId = user.id;
    const month = (new Date().getMonth() + 1);

    console.log('Testing for user:', user.email || user.username, 'id=', userId, 'month=', month);

    const chart = await visitService.getChartData(app, userId, null, month);
    console.log('Chart data:', JSON.stringify(chart, null, 2));

    const reportGeneral = await visitService.getReport(app, userId, { type: 'general', month });
    console.log('Report (general) rows:', reportGeneral.length);
    if (reportGeneral.length) console.log(JSON.stringify(reportGeneral.slice(0,20), null, 2));

    const reportNoService = await visitService.getReport(app, userId, { type: 'no_service' });
    console.log('Report (no_service) rows:', reportNoService.length);
    if (reportNoService.length) console.log(JSON.stringify(reportNoService.slice(0,20), null, 2));

    process.exit(0);
  } catch (err){
    console.error('Test script error:', err);
    process.exit(1);
  }
}

main();
