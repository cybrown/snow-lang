const {
    string,
    optWhitespace,
    seq,
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

const Expression = lazy(() => Sum);

const ParenthesisList = seq(
    string('('),
    sepBy(Expression, string(',')),
    string(')')
).map(values => ({
    kind: 'ParenthesisList',
    value: values[1]
}));

const BracesList = seq(
    string('['),
    sepBy(Expression, string(',')),
    string(']')
).map(values => ({
    kind: 'BracesList',
    value: values[1]
}));

const SumOperator = alt(
    string('+'),
    string('-')
);

const ProductOperator = alt(
    string('*'),
    string('/'),
    string('%')
);



const Number = seq(
    digit,
    digits,
    seq(
        string('.'),
        digits
    ).atMost(1).map(v => v[0] ? v[0].join('') : v[0])
).map(values => ({
    kind: 'Number',
    value: values.join('')
}));

const Identifier = seq(
    letter,
    alt(letter, digit).many().map(str => str.join(''))
).map(v => ({
    kind: 'Identifier',
    text: v.join('')
}));

const Parenthesis = seq(
    string('('),
    Expression,
    string(')')
).map(values => values[1]);

const BaseExpression = alt(
    Identifier,
    Number,
    Parenthesis
);

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

module.exports.parseExpression = input => Expression.parse(input);
