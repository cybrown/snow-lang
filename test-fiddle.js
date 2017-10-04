const yaml = require('js-yaml');

const {parseExpression, parseProgram} = require('./lib/parser');
const {compileAst} = require('./lib/compile');
const {desugarize} = require('./lib/desugarizer');
const {run} = require('./lib/run');
const {dumpOpcodes} = require('./lib/util');

const ast = parseProgram(`
    fun print(str) {
        #PUTS(str + 1, #LOAD(str))
    };

    print("Hello, world !\\n")
`);

console.log(yaml.dump(ast))

const desugarizedAst = desugarize(ast);

console.log(yaml.dump(desugarizedAst))

const bc = compileAst(desugarizedAst);

dumpOpcodes(bc.functions);

const result = run(bc);
console.log(result);
