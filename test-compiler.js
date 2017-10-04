const fs = require('fs');
const yaml = require('js-yaml');
const {compileAst} = require('./lib/compile');

let mismatch = 0;
let total = 0;
let created = 0;

const files = fs.readdirSync('./test-samples-desugarizer');

files.forEach(fileName => {
    total++;
    const path = `./test-samples-desugarizer/${fileName}`;
    const ast = yaml.load(fs.readFileSync(path));
    const opcodes = compileAst(ast, 64);
    const actual = yaml.dump(Object.assign({}, opcodes, {
        memory: Buffer.from(opcodes.memory).toString('hex')
    }));

    const expectedPath = `./test-samples-compiler/${fileName}`;

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

console.log(`Compiler test report: ${mismatch} mismatches, ${created} created, ${total} total`);
