const yaml = require('js-yaml');

const {parseExpression, parseProgram} = require('./lib/parser');
const {compileAst} = require('./lib/compile');
const {desugarize} = require('./lib/desugarizer');
const {run} = require('./lib/run');
const {dumpOpcodes} = require('./lib/util');

const ast = parseProgram(`
    #PUTCHAR(72);
    #PUTCHAR(101);
    #PUTCHAR(108);
    #PUTCHAR(108);
    #PUTCHAR(111);
    #PUTCHAR(44);
    #PUTCHAR(32);
    #PUTCHAR(119);
    #PUTCHAR(111);
    #PUTCHAR(114);
    #PUTCHAR(108);
    #PUTCHAR(100);
    #PUTCHAR(32);
    #PUTCHAR(33);
    #PUTCHAR(10)
`);

console.log(yaml.dump(ast))

const desugarizedAst = desugarize(ast);

console.log(yaml.dump(desugarizedAst))

const bc = compileAst(desugarizedAst);

dumpOpcodes(bc);

const result = run(bc);
console.log(result);
