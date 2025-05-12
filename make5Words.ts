import fs from 'fs';
import path from 'path';

const input = 'words.txt';
const inputDelimiter = '\n';
const output = '5words3.txt';
const outputDelimiter = '\n';

const words5 = fs.readFileSync(path.join(__dirname, input))
    .toString()
    .split(inputDelimiter)
    .filter((word) => word?.length === 5);

fs.writeFileSync(path.join(__dirname, output), words5.join(outputDelimiter));

