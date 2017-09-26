const {parseExpression} = require('./parser');

const opForOperator = {
    '+': 'ADD',
    '-': 'SUB',
    '*': 'MUL',
    '/': 'DIV',
    '%': 'MOD'
};

const allCompilers = {
    Call(node, cb, ctx) {
        ctx.instructions.push({
            kind: 'CALL'
        })
    },
    Binary(node, cb, ctx) {
        cb(node.left);
        cb(node.right);
        ctx.instructions.push({
            kind: opForOperator[node.operator]
        });
    },
    Identifier(node, cb, ctx) {
        ctx.instructions.push({
            kind: 'LOAD',
            args: [node.text]
        })
    },
    Number(node, cb, ctx) {
        ctx.instructions.push({
            kind: 'CONST',
            args: [node.value]
        })
    },
    If(node, cb, ctx) {
        cb(node.condition);
        const ifId = ctx.ifId++;
        ctx.instructions.push({
            kind: 'BRANCH_COND',
            args: [
                'ifTrue-' + ifId,
                'ifFalse-' + ifId
            ]
        });
        const currentInstructions = ctx.instructions;
        ctx.blocks['ifTrue-' + ifId] = [];
        ctx.blocks['ifFalse-' + ifId] = [];
        ctx.blocks['ifEnd-' + ifId] = [];
        ctx.instructions = ctx.blocks['ifTrue-' + ifId];
        cb(node.ifTrue);
        ctx.instructions.push({
            kind: 'BRANCH',
            args: [
                'ifEnd-' + ifId
            ]
        });
        ctx.instructions = ctx.blocks['ifFalse-' + ifId];
        cb(node.ifFalse);
        ctx.instructions.push({
            kind: 'BRANCH',
            args: [
                'ifEnd-' + ifId
            ]
        });
        ctx.instructions = ctx.blocks['ifEnd-' + ifId];
    }
};

function compile(source) {
    return compileAst(parseExpression(source));
}

function compileNode(compilers, node, ctx) {
    compilers[node.kind](node, node => compileNode(compilers, node, ctx), ctx);
}

function compileAst(ast) {
    const blockStack = [];
    const instructions = [];
    const blocks = {
        _main: instructions
    };
    compileNode(allCompilers, ast.value, {
        instructions,
        blockStack,
        blocks,
        ifId: 0
    });
    return blocks;
}

module.exports.compile = compile;
module.exports.compileAst = compileAst;
