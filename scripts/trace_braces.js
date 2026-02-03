const fs = require('fs');
const s = fs.readFileSync('src/services/visits.js','utf8');
const lines = s.split(/\r?\n/);
let balance = 0;
for (let i=0;i<lines.length;i++){
  const l = lines[i];
  let opens = (l.match(/{/g)||[]).length;
  let closes = (l.match(/}/g)||[]).length;
  balance += opens - closes;
  if (opens || closes) console.log(`${i+1}	+${opens}	-${closes}	=> ${balance}	${l.trim()}`);
}
console.log('Final balance', balance);
