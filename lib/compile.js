const {parseExpression} = require('./parser');
const {visit} = require('./visit');

const opForOperator = {
    '+': 'ADD',
    '-': 'SUB',
    '*': 'MUL',
    '/': 'DIV',
    '%': 'MOD'
};

const opcodeGenVisitor = {
    Call: {
        enter(node, ctx) {
            console.log(`${ctx.spaces}Call`)
            ctx.spaces += '  ';
        },
        leave(node, ctx) {
            ctx.instructions.push({
                kind: 'CALL'
            })
        }
    },
    Binary: {
        enter(node, ctx) {
        },
        leave(node, ctx) {
            ctx.instructions.push({
                kind: opForOperator[node.operator]
            })
        }
    },
    Identifier: {
        enter(node, ctx) {
        },
        leave(node, ctx) {
            ctx.instructions.push({
                kind: 'LOAD',
                args: [node.text]
            })
        }
    },
    Number: {
        enter(node, ctx) {
        },
        leave(node, ctx) {
            ctx.instructions.push({
                kind: 'CONST',
                args: [node.value]
            })
        }
    }
};

function compile(source) {
    const ast = parseExpression(source).value;
    const instructions = [];
    visit(opcodeGenVisitor, ast, {
        instructions
    });
    return instructions;
}

module.exports.compile = compile;
