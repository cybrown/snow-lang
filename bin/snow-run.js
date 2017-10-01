#! /usr/bin/env node

const fs = require('fs');
const {parseProgram} = require('../lib/parser');
const {compileAst} = require('../lib/compile');
const {desugarize} = require('../lib/desugarizer');
const {run} = require('../lib/run');

const path = process.argv[2];

function readSource() {
    return new Promise((resolve, reject) => {
        if (path === '-' || !path) {
            let b = new Buffer('');
            const buffers = [];
            process.stdin.on('data', data => {
                buffers.push(data);
            });
            process.stdin.on('end', () => {
                resolve(Buffer.concat(buffers).toString('UTF-8'));
            });
            process.stdin.on('error', reject);
        } else {
            fs.readFile(path, {encoding: 'UTF-8'}, (err, sources) => {
                if (err) return reject;
                resolve(sources);
            });
        }
    });
}

readSource().then(sources => {
    const ast = parseProgram(sources);
    const desugarizedAst = desugarize(ast);
    const bc = compileAst(desugarizedAst);
    const result = run(bc);
    process.exit(result);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
