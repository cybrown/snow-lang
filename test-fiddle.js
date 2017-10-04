const yaml = require('js-yaml');

const {parseExpression, parseProgram} = require('./lib/parser');
const {compileAst} = require('./lib/compile');
const {desugarize} = require('./lib/desugarizer');
const {run} = require('./lib/run');
const {dumpOpcodes} = require('./lib/util');

const ast = parseProgram(`
    #PUTS([72, 101, 108, 108, 111, 44, 32, 119, 111, 114, 108, 100, 32, 33, 10], 15)
`);

console.log(yaml.dump(ast))

const desugarizedAst = desugarize(ast);

console.log(yaml.dump(desugarizedAst))

const bc = compileAst(desugarizedAst);

dumpOpcodes(bc.functions);

const result = run(bc);
console.log(result);
