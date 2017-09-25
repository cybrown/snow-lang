const fs = require('fs');
const {parseExpression} = require('./lib/parser');

verify('Number_3', '3');
verify('Number_34', '34');
verify('Number_345', '345');
verify('Number_3.14', '3.14');
verify('Identifier_a', 'a');
verify('Identifier_abcd', 'abcd');
verify('Multiple_binaries', 'a+b-c+d');
verify('Call_empty', 'abc()');
verify('Call_one_args', 'a(3)');
verify('Call_two_args', 'a(b,c)');
verify('Call_three_args', 'a(b,c,314)');
verify('Multiple_calls_and_indices_1', 'a(b)[c]');
verify('Multiple_calls_and_indices_2', 'a[b](c)[d](e)');
verify('Multiple_binaries_with_product', 'a+b*c-d');
verify('Multiple_binaries_with_product_and_parenthesis_1', '(a+b)*c-d');
verify('Multiple_binaries_with_product_and_parenthesis_2', '(a+b)*(c-d)');

function verify(name, expr) {
    const fileName = `./test/${name}.json`;
    const ast = parseExpression(expr);
    if (ast.status === false) {
        console.log(`ERROR ${name}`)
        console.log(JSON.stringify(ast, null, '  '));
        return;
    }
    const content = JSON.stringify(ast.value, null, '  ');
    if (!fs.existsSync(fileName)) {
        fs.writeFileSync(fileName, content, {encoding: 'UTF-8'});
        console.log(`CREATED ${name}`);
    } else {
        const contentFromFile = fs.readFileSync(fileName, {encoding: 'UTF-8'});
        if (content === contentFromFile) {
            console.log(`OK ${name}`);
        } else {
            console.log(`!! ${name}`);
        }
    }
}
