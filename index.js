const {parseExpression, parseProgram} = require('./lib/parser');
const {compileAst} = require('./lib/compile');
const {run} = require('./lib/run');
const {dumpOpcodes} = require('./lib/util');

const ast = parseProgram(`
    fun addOne(a) {
        a+1
    };
    addOne(41)
`);

const bc = compileAst(ast);

dumpOpcodes(bc);

const result = run(bc);
console.log(result);
