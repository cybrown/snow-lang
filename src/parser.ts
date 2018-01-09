import {
    string,
    optWhitespace,
    seq,
    digit,
    digits,
    letters,
    letter,
    alt,
    sepBy,
    lazy,
    noneOf,
    Parser
} from 'parsimmon';
import * as fs from 'fs';
import {groupBy, entries} from 'lodash';
import { NativeOperationNode, VarDeclarationNode, ArrayLiteralNode, NumberLiteralNode, StringLiteralNode, FunctionNode, IfNode, AstNode, BinaryNode } from './ast-nodes';

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

const AssignementOperator = string('=').trim(_);

const Block = seq(
    string('{').trim(_),
    Expression,
    string('}').trim(_)
).map(node => node[1]);

const IfExpression = seq(
    string('if').trim(_),
    Expression,
    Block,
    string('else').trim(_),
    Block
).map(node => <IfNode> {
    kind: 'If',
    condition: node[1],
    ifTrue: node[2],
    ifFalse: node[4]
});

const NumberLiteral = seq(
    digit,
    digits,
    seq(
        string('.'),
        digits
    ).atMost(1).map(v => v[0] ? v[0].join('') : v[0])
).trim(_).map(values => <NumberLiteralNode> {
    kind: 'NumberLiteral',
    value: Number(values.join(''))
});

const Identifier = seq(
    letter,
    alt(letter, digit, string('_')).many().map(str => str.join(''))
).trim(_).map(v => ({
    kind: 'Identifier',
    text: v.join('')
}));

const NativeOperation = seq(
    string('#'),
    Identifier.map(i => i.text),
    _,
    ParenthesisList.map(p => p.value),
    _
).map(node => <NativeOperationNode> {
    kind: 'NativeOperation',
    operation: node[1],
    arguments: node[3]
});

const VarDeclaration = seq(
    string('var').trim(_),
    Identifier.map(identifier => identifier.text)
).map(node => <VarDeclarationNode> {
    kind: 'VarDeclaration',
    name: node[1]
});

const Parenthesis = seq(
    string('('),
    Expression,
    string(')')
).trim(_).map(values => values[1]);

const ArrayLiteral = seq(
    string('['),
    sepBy(NumberLiteral, string(',').trim(_)),
    string(']')
).map(node => <ArrayLiteralNode> {
    kind: 'ArrayLiteral',
    values: node[1]
});

const StringLiteral = seq(
    string('"'),
    alt(
        noneOf('"\\'),
        string('\\n').map(v => '\n')
    ).many().map(v => v.join('')),
    string('"')
).map(node => <StringLiteralNode> {
    kind: 'StringLiteral',
    text: node[1]
});

const BaseExpression = alt(
    NativeOperation,
    IfExpression,
    Identifier,
    NumberLiteral,
    Parenthesis,
    ArrayLiteral,
    StringLiteral
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

const binaryOperatorsList: [string, number][] = [
    ['+', 50],
    ['-', 50],
    ['*', 30],
    ['/', 30],
    ['%', 30]
];

const LastBinaryOperator = entries(groupBy(binaryOperatorsList, elem => elem[1])).
    map(entry => entry[1].map(elem => elem[0]))
    .reduce((prev, cur) => {
        return CreateBinaryLeft('Binary', prev, alt(...cur.map(str => string(str))).trim(_));
    }, Postfix);

const Assignment = CreateBinaryLeft('Assignement', LastBinaryOperator, AssignementOperator);

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

const ParameterList = seq(
    string('(').trim(_),
    sepBy(
        Identifier.map(identifier => identifier.text),
        string(',').trim(_)
    ),
    string(')').trim(_)
).map(node => node[1]);

const FunctionDefinition = seq(
    string('fun').trim(_),
    Identifier.map(identifier => identifier.text),
    ParameterList,
    Block
).map(node => <FunctionNode> {
    kind: 'FunctionDefinition',
    name: node[1],
    parameters: node[2],
    body: node[3]
});

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

module.exports.parseExpression = (input: string) => Expression.parse(input);
module.exports.parseProgram = (input: string) => ProgramWithExpressions.parse(input);

function CreateBinaryLeft (kind: AstNode['kind'], nextParser: Parser<BinaryNode>, operator: Parser<string>) {
    return seq(
        nextParser,
        seq(
            operator.trim(_),
            nextParser
        ).trim(_).map(v => [v[0], v[1]]).many()
    ).map(([first, rest]) => rest.reduce((acc, ch) => ({
        kind: <any> kind,
        operator: <string> ch[0],
        left: <BinaryNode> acc,
        right: <BinaryNode> ch[1]
    }), <any> first));
}
