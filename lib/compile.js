const {parseExpression} = require('./parser');

const opForOperator = {
    '+': 'ADD',
    '-': 'SUB',
    '*': 'MUL',
    '/': 'DIV',
    '%': 'MOD'
};

const allCompilers = {
    Program(node, cb, ctx) {
        node.expressions.forEach(expression => cb(expression));
    },
    FunctionDefinition(node, cb, ctx) {
        const oldBlock = ctx.currentBlock;
        const oldFunction = ctx.currentFunction;
        ctx.functions[node.name] = {
            ifId: 0,
            parameters: node.parameters,
            blocks: {
                _main: []
            }
        };
        ctx.currentFunction = ctx.functions[node.name];
        ctx.currentBlock = ctx.functions[node.name].blocks._main;
        cb(node.body);
        ctx.currentFunction = oldFunction;
        ctx.currentBlock = oldBlock;
    },
    Call(node, cb, ctx) {
        node.args.forEach(arg => {
            cb(arg);
        });
        ctx.currentBlock.push({
            kind: 'CALL',
            args: [
                node.caller.text,
                node.args.length
            ]
        });
    },
    Binary(node, cb, ctx) {
        cb(node.left);
        cb(node.right);
        ctx.currentBlock.push({
            kind: opForOperator[node.operator]
        });
    },
    Identifier(node, cb, ctx) {
        ctx.currentBlock.push({
            kind: 'LOAD',
            args: [node.text]
        })
    },
    Number(node, cb, ctx) {
        ctx.currentBlock.push({
            kind: 'CONST',
            args: [node.value]
        })
    },
    If(node, cb, ctx) {
        cb(node.condition);
        const ifId = ctx.currentFunction.ifId++;
        ctx.currentBlock.push({
            kind: 'BRANCH_COND',
            args: [
                'ifTrue-' + ifId,
                'ifFalse-' + ifId
            ]
        });
        ctx.currentFunction.blocks['ifTrue-' + ifId] = [];
        ctx.currentFunction.blocks['ifFalse-' + ifId] = [];
        ctx.currentFunction.blocks['ifEnd-' + ifId] = [];
        ctx.currentBlock = ctx.currentFunction.blocks['ifTrue-' + ifId];
        cb(node.ifTrue);
        ctx.currentBlock.push({
            kind: 'BRANCH',
            args: [
                'ifEnd-' + ifId
            ]
        });
        ctx.currentBlock = ctx.currentFunction.blocks['ifFalse-' + ifId];
        cb(node.ifFalse);
        ctx.currentBlock.push({
            kind: 'BRANCH',
            args: [
                'ifEnd-' + ifId
            ]
        });
        ctx.currentBlock = ctx.currentFunction.blocks['ifEnd-' + ifId];
    }
};

function compile(source) {
    return compileAst(parseExpression(source));
}

function compileNode(compilers, node, ctx) {
    if (!compilers[node.kind]) {
        throw new Error('Node kind not supported: ' + node.kind);
    }
    compilers[node.kind](node, node => compileNode(compilers, node, ctx), ctx);
}

function compileAst(ast) {
    const functions = {
        _main: {
            ifId: 0,
            parameters: [],
            blocks: {
                _main: []
            }
        }
    };
    compileNode(allCompilers, ast.value, {
        functions,
        currentBlock: functions._main.blocks._main,
        currentFunction: functions._main
    });
    return functions;
}

module.exports.compile = compile;
module.exports.compileAst = compileAst;
