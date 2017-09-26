const fs = require('fs');
const {parseExpression} = require('./lib/parser');

let errors = 0;
let total = 0;

verify('Number_3', '3');
verify('Number_34', '34');
verify('Number_345', '345');
verify('Number_3.14', '3.14');
verify('Identifier_a', 'a');
verify('Identifier_abcd', 'abcd');
verify('Multiple_binaries_1', 'a+b-c+d');
verify('Multiple_binaries_2', ' a + b - c + d ');
verify('Call_empty_1', 'abc()');
verify('Call_empty_2', ' abc ( ) ');
verify('Call_one_args_1', 'a(3)');
verify('Call_one_args_2', ' a ( 3 ) ');
verify('Call_two_args_1', 'a(b,c)');
verify('Call_two_args_2', ' a ( b , c ) ');
verify('Call_three_args', 'a(b,c,314)');
verify('Multiple_calls_and_indices_1', 'a(b)[c]');
verify('Multiple_calls_and_indices_2', 'a[b](c)[d](e)');
verify('Multiple_calls_and_indices_3', ' a [ b ] ( c ) [ d ] ( e ) ');
verify('Multiple_binaries_with_product', 'a+b*c-d');
verify('Multiple_binaries_with_product_and_parenthesis_1', '(a+b)*c-d');
verify('Multiple_binaries_with_product_and_parenthesis_2', '(a+b)*(c-d)');
verify('Multiple_binaries_with_product_and_parenthesis_3', ' ( a + b ) * ( c - d ) ');
//verify('If_simple', 'if a {b}else{c}');

console.log(`${errors} errors, ${total} total`);

function verify(name, expr) {
    total++;
    const fileName = `./test/${name}.json`;
    const ast = parseExpression(expr);
    if (ast.status === false) {
        errors++;
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
            errors++;
            console.log(`!! ${name}`);
        }
    }
}
