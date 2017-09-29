const fs = require('fs');
const yaml = require('js-yaml');
const {desugarize} = require('./lib/desugarizer');

const files = fs.readdirSync('./parser-test-samples');

files.forEach(fileName => {
    const path = `./parser-test-samples/${fileName}`;
    const rawAst = {value: yaml.load(fs.readFileSync(path))};
    const actual = yaml.dump(desugarize(rawAst));

    const expectedPath = `./test-samples-desugarizer/${fileName}`;

    if (fs.existsSync(expectedPath)) {
        const expected = fs.readFileSync(expectedPath, {encoding: 'UTF-8'});
        if (actual === expected) {
            console.log('OK ' + fileName);
        } else {
            console.log('MISMATCH ' + fileName);
        }
    } else {
        fs.writeFileSync(expectedPath, actual, {encoding: 'UTF-8'});
        console.log('CREATED ' + fileName);
    }
});
