const fs = require('fs');
const yaml = require('js-yaml');
const {parseProgram} = require('./lib/parser');

let parseError = 0;
let mismatch = 0;
let total = 0;
let created = 0;

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
verify('If_simple', 'if a { b } else { c }');
verify('Multiple_expression', 'a ; 1+1; c; d');
verify('Multiple_expression_in_subexpression', '(a ; 1+1; c; d)');
verify('Multi_expression_program_with_function_definition', `
    a;
    fun abc ( a, b ) { toto };
    b
`);
verify('Assignement_global', `a = a + 5; a`);
verify('Assignement_parameter', `
    fun abc(bfg) {
        bfg = bfg + 5;
        bfg
    };
    abc(5)
`);
verify('Local_variables', `
    fun abc(bfg) {
        var a;
        a = 6;
        var b;
        b = bfg + a;
        b
    };
    abc(5)
`);

console.log(`${parseError} errors, ${mismatch} mismatches, ${created} created, ${total} total`);

function verify(name, expr) {
    total++;
    const fileName = `./test-samples-parser/${name}.yml`;
    const ast = parseProgram(expr);
    if (ast.status === false) {
        parseError++;
        console.log(`ERROR ${name}`)
        console.log(yaml.dump(ast));
        return;
    }
    const content = yaml.dump(ast.value);
    if (!fs.existsSync(fileName)) {
        fs.writeFileSync(fileName, content, {encoding: 'UTF-8'});
        created++;
        console.log(`CREATED ${name}`);
    } else {
        const contentFromFile = fs.readFileSync(fileName, {encoding: 'UTF-8'});
        if (content !== contentFromFile) {
            mismatch++;
            console.log(`MISMATCH ${name}`);
        }
    }
}
