const {parseExpression, parseProgram} = require('./lib/parser');
const {compileAst} = require('./lib/compile');
const {desugarize} = require('./lib/desugarizer');
const {run} = require('./lib/run');
const {dumpOpcodes} = require('./lib/util');

const ast = parseProgram(`
    fun abc(bfg) {
        var a;
        a = 6;
        var b;
        b = bfg + a;
        b
    };
    abc(5)
`);

console.log(JSON.stringify(ast, null, '  '))

const desugarizedAst = desugarize(ast);

console.log(JSON.stringify(desugarizedAst, null, '  '))

const bc = compileAst(desugarizedAst);

dumpOpcodes(bc);

const result = run(bc, {
    a: 4
});
console.log(result);
