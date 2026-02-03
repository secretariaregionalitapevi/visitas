const visitService = require('../src/services/visits');
const db = require('../src/config/dbConfig');

(async ()=>{
  try{
    const app = { connection: db.connection() };
    const res = await visitService.listGroupedVisits(app, 1, 1, 3);
    console.log('RESULT', res.slice(0,10));
  }catch(err){
    console.error('ERROR', err && err.stack ? err.stack : err);
  }
})();
