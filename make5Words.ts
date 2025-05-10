import fs from 'fs';
import path from 'path';

const input = '5words2.txt';
const inputDelimiter = ',';
const output = '5words4.txt';
const outputDelimiter = '\n';

const words5 = fs.readFileSync(path.join(__dirname, input))
    .toString()
    .split(inputDelimiter)
    .filter((word) => word?.length === 5);

fs.writeFileSync(path.join(__dirname, output), words5.join(outputDelimiter));

