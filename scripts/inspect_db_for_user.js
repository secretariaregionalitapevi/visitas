require('dotenv').config();
const db = require('../src/config/dbConfig');
const conn = db.connection();

async function main(){
  try{
    const email = process.env.TEST_USER_EMAIL || 'ricardograngeiro@gmail.com';
    const [userRows] = await conn.query('SELECT id, email, username FROM users WHERE email = $1 LIMIT 1', [email]);
    let user = null;
    if (userRows && userRows.length) user = userRows[0];
    else {
      const [all] = await conn.query('SELECT id, email, username FROM users LIMIT 1');
      user = all && all.length ? all[0] : null;
    }

    if (!user) {
      console.error('No user found');
      process.exit(1);
    }

    console.log('Using user:', user);

    const [userCities] = await conn.query('SELECT * FROM user_cities WHERE user_id = $1', [user.id]);
    console.log('\nuser_cities:', userCities);

    const [userChurches] = await conn.query('SELECT * FROM user_churches WHERE user_id = $1', [user.id]);
    console.log('\nuser_churches:', userChurches);

    const [cities] = await conn.query('SELECT * FROM cities ORDER BY id LIMIT 50');
    console.log('\ncities (sample):', cities.slice(0,50));

    const [churches] = await conn.query('SELECT id, "COMUM", "CIDADE" FROM churches ORDER BY id LIMIT 200');
    console.log('\nchurches (sample):', churches.slice(0,200));

    const [visits] = await conn.query('SELECT * FROM visits ORDER BY id DESC LIMIT 50');
    console.log('\nvisits (recent 50):', visits);

    // visits for user's cities
    const cityIds = userCities.map(c=>c.city_id);
    if (cityIds.length) {
      const [visByCities] = await conn.query('SELECT * FROM visits WHERE city_id = ANY($1::int[]) ORDER BY id DESC LIMIT 100', [cityIds]);
      console.log('\nvisits for user cities:', visByCities.slice(0,50));
    } else {
      console.log('\nNo user_cities entries for this user.');
    }

    // visits for user's churches
    const churchIds = userChurches.map(c=>c.church_id);
    if (churchIds.length) {
      const [visByChurches] = await conn.query('SELECT * FROM visits WHERE church_id = ANY($1::int[]) ORDER BY id DESC LIMIT 100', [churchIds]);
      console.log('\nvisits for user churches:', visByChurches.slice(0,50));
    } else {
      console.log('\nNo user_churches entries for this user.');
    }

    process.exit(0);
  } catch (err){
    console.error('inspect error:', err);
    process.exit(1);
  }
}

main();
