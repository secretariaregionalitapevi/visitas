const fs = require('fs');
const path = 'src/services/visits.js';
const s = fs.readFileSync(path, 'utf8');
console.log('len', s.length);
console.log('lines', s.split(/\r?\n/).length);
console.log('backticks', (s.match(/`/g) || []).length);
console.log('openBrace', (s.match(/{/g) || []).length, 'closeBrace', (s.match(/}/g) || []).length);
// show last 40 lines
const lines = s.split(/\r?\n/);
console.log('--- last 40 lines ---');
lines.slice(-40).forEach((l, i) => console.log(lines.length-40 + i + 1, l));
