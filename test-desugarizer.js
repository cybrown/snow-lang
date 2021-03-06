const fs = require('fs');
const yaml = require('js-yaml');
const {desugarize} = require('./lib/desugarizer');

let mismatch = 0;
let total = 0;
let created = 0;

const files = fs.readdirSync('./test-samples-parser');

files.forEach(fileName => {
    total++;
    const path = `./test-samples-parser/${fileName}`;
    const rawAst = {value: yaml.load(fs.readFileSync(path))};
    const actual = yaml.dump(desugarize(rawAst));

    const expectedPath = `./test-samples-desugarizer/${fileName}`;

    if (fs.existsSync(expectedPath)) {
        const expected = fs.readFileSync(expectedPath, {encoding: 'UTF-8'});
        if (actual !== expected) {
            mismatch++;
            console.log('MISMATCH ' + fileName);
        }
    } else {
        fs.writeFileSync(expectedPath, actual, {encoding: 'UTF-8'});
        created++;
        console.log('CREATED ' + fileName);
    }
});

console.log(`Desugarizer test report: ${mismatch} mismatches, ${created} created, ${total} total`);
