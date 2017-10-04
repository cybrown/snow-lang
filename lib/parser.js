const {
    string,
    optWhitespace,
    seq,
    seqObj,
    digit,
    digits,
    letters,
    letter,
    alt,
    sepBy,
    lazy
} = require('parsimmon');
const fs = require('fs');
const {CreateBinaryLeft} = require('./util');

const _ = optWhitespace;

const Expression = lazy(() => ExpressionsAndVarDeclarations);
const UniqueExpression = lazy(() => Assignment);

const ParenthesisList = seq(
    string('(').trim(_),
    sepBy(UniqueExpression, string(',').trim(_)),
    string(')').trim(_)
).map(values => ({
    kind: 'ParenthesisList',
    value: values[1]
}));

const BracesList = seq(
    string('[').trim(_),
    sepBy(UniqueExpression, string(',').trim(_)),
    string(']').trim(_)
).map(values => ({
    kind: 'BracesList',
    value: values[1]
}));

const SumOperator = alt(
    string('+'),
    string('-')
).trim(_);

const ProductOperator = alt(
    string('*'),
    string('/'),
    string('%')
).trim(_);

const AssignementOperator = string('=').trim(_);

const Block = seqObj(
    string('{').trim(_),
    ['expression', Expression],
    string('}').trim(_)
).map(node => node.expression);

const IfExpression = seqObj(
    string('if').trim(_),
    ['condition', Expression],
    ['ifTrue', Block],
    string('else').trim(_),
    ['ifFalse', Block]
).map(node => Object.assign({kind: 'If'}, node));

const Number = seq(
    digit,
    digits,
    seq(
        string('.'),
        digits
    ).atMost(1).map(v => v[0] ? v[0].join('') : v[0])
).trim(_).map(values => ({
    kind: 'Number',
    value: values.join('')
}));

const Identifier = seq(
    letter,
    alt(letter, digit, string('_')).many().map(str => str.join(''))
).trim(_).map(v => ({
    kind: 'Identifier',
    text: v.join('')
}));

const NativeOperation = seqObj(
    string('#'),
    ['operation', Identifier.map(i => i.text)],
    _,
    ['arguments', ParenthesisList.map(p => p.value)],
    _
).map(node => Object.assign({
    kind: 'NativeOperation'
}, node));

const VarDeclaration = seqObj(
    string('var').trim(_),
    ['name', Identifier.map(identifier => identifier.text)]
).map(node => Object.assign({kind: 'VarDeclaration'}, node));

const Parenthesis = seq(
    string('('),
    Expression,
    string(')')
).trim(_).map(values => values[1]);

const ArrayLiteral = seqObj(
    string('['),
    ['values', sepBy(Number, string(',').trim(_))],
    string(']')
).map(node => Object.assign({
    kind: 'ArrayLiteral',
}, node));

const BaseExpression = alt(
    NativeOperation,
    IfExpression,
    Identifier,
    Number,
    Parenthesis,
    ArrayLiteral
).trim(_);

const Postfix = seq(
    BaseExpression,
    alt(ParenthesisList, BracesList).many()
).map(([first, rest]) => {
    return rest.reduce((prev, cur) => {
        switch (cur.kind) {
            case 'ParenthesisList':
                return {
                    kind: 'Call',
                    caller: prev,
                    args: cur.value
                };
            case 'BracesList':
                return {
                    kind: 'Index',
                    expression: prev,
                    index: cur.value
                };
            default:
                throw new Error('Unknown kind for Postfix operator: ' + cur.kind);
        }
    }, first);
});

const Product = CreateBinaryLeft('Binary', Postfix, ProductOperator);

const Sum = CreateBinaryLeft('Binary', Product, SumOperator);

const Assignment = CreateBinaryLeft('Assignement', Sum, AssignementOperator);

const ExpressionsAndVarDeclarations = sepBy(
    alt(
        VarDeclaration,
        UniqueExpression
    ),
    string(';').trim(_)
).map(expressions => expressions.length > 1 ? ({
    kind: 'ExpressionsAndVarDeclarations',
    expressions
}) : expressions[0]);

const ParameterList = sepBy(
    Identifier.map(identifier => identifier.text),
    string(',').trim(_)
).wrap(
    string('(').trim(_),
    string(')').trim(_)
);

const FunctionDefinition = seqObj(
    string('fun').trim(_),
    ['name', Identifier.map(identifier => identifier.text)],
    ['parameters', ParameterList],
    ['body', Block]
).map(node => Object.assign({ kind: 'FunctionDefinition' }, node));

const ProgramWithExpressions = sepBy(
    alt(
        FunctionDefinition,
        VarDeclaration,
        UniqueExpression
    ),
    string(';').trim(_)
).map(expressions => ({
    kind: 'ProgramWithExpressions',
    expressions
}));

module.exports.parseExpression = input => Expression.parse(input);
module.exports.parseProgram = input => ProgramWithExpressions.parse(input);
