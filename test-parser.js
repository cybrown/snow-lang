const fs = require('fs');
const yaml = require('js-yaml');
const {parseProgram} = require('./lib/parser');

let parseError = 0;
let mismatch = 0;
let total = 0;
let created = 0;

const files = fs.readdirSync('./test-samples-sources');

files.forEach(name => {
    total++;
    const sourcePath = `./test-samples-sources/${name}`;
    const fileName = `./test-samples-parser/${name.substring(0, name.length - 5)}.yml`;
    const expr = fs.readFileSync(sourcePath, {encoding: 'UTF-8'});
    const ast = parseProgram(expr);
    if (ast.status === false) {
        parseError++;
        console.log(`ERROR ${name}`)
        console.log(yaml.dump(ast));
        return;
    }
    const content = yaml.dump(ast.value);
    if (!fs.existsSync(fileName)) {
        fs.writeFileSync(fileName, content, {encoding: 'UTF-8'});
        created++;
        console.log(`CREATED ${name}`);
    } else {
        const contentFromFile = fs.readFileSync(fileName, {encoding: 'UTF-8'});
        if (content !== contentFromFile) {
            mismatch++;
            console.log(`MISMATCH ${name}`);
        }
    }
});

console.log(`Parser test report: ${parseError} errors, ${mismatch} mismatches, ${created} created, ${total} total`);
