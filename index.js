const {parseExpression} = require('./lib/parser');
const {compileAst} = require('./lib/compile');
const {run} = require('./lib/run');

/*
const ast = parseExpression('if 1 {2} else {3}');

//console.log(JSON.stringify(ast, null, '  '));

const bc = compileAst(ast);

//console.log(JSON.stringify(bc, null, '  '));


const result = run(bc);

console.log(result);
*/

const ast = parseExpression('a; b');
console.log(JSON.stringify(ast, null, '  '));
