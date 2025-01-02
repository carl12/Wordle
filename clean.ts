import * as fs from 'fs';

const a = fs.readFileSync('./wordle/5words2.txt').toString();
const b = a.split('\n').join(',');
fs.writeFileSync('./wordle/5words2.txt', b);
