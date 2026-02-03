const fs = require('fs');
const s = fs.readFileSync('src/services/visits.js','utf8');
const lines = s.split(/\r?\n/);
let balance = 0;
let minBalance = 1e9;
let minLine = -1;
for (let i=0;i<lines.length;i++){
  const l = lines[i];
  for (const ch of l){
    if (ch === '{') balance++;
    if (ch === '}') balance--;
  }
  if (balance < minBalance){ minBalance = balance; minLine = i+1; }
}
console.log('Final balance:', balance);
console.log('Min balance:', minBalance, 'at line', minLine);
// show snippet around minLine
const start = Math.max(1, minLine-6);
const end = Math.min(lines.length, minLine+6);
for (let i=start;i<=end;i++){
  console.log(i, lines[i-1]);
}
