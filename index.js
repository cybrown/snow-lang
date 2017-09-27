const {parseExpression, parseProgram} = require('./lib/parser');
const {compileAst} = require('./lib/compile');
const {run} = require('./lib/run');
const {dumpOpcodes} = require('./lib/util');

const ast = parseProgram(`
    fun fact(a) {
        if (a) {a * fact(a - 1)} else {1}
    };
    fact(6)
`);

const bc = compileAst(ast);

dumpOpcodes(bc);

const result = run(bc);
console.log(result);
