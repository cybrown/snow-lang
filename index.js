const {parseExpression, parseProgram} = require('./lib/parser');
const {compileAst} = require('./lib/compile');
const {run} = require('./lib/run');
const {dumpOpcodes} = require('./lib/util');

const ast = parseProgram(`
    fun abc() {
        4+5
    };
    abc();
    3
`);

const bc = compileAst(ast);

//dumpOpcodes(bc);

const result = run(bc, {a: 1});
console.log(result);
