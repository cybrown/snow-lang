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
        node.functions.forEach(func => cb(func));
    },
    FunctionDefinition(node, cb, ctx) {
        ctx.functions[node.name] = {
            ifId: 0,
            parameters: node.parameters,
            locals: {},
            blocks: {
                _main: []
            }
        };
        ctx.currentFunction = ctx.functions[node.name];
        ctx.currentBlock = ctx.functions[node.name].blocks._main;
        node.locals.forEach(local => ctx.currentFunction.locals[local.name] = true);
        cb(node.body);
        ctx.currentBlock.push({
            kind: 'RETURN'
        });
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
    },
    Assignement(node, cb, ctx) {
        cb(node.right);
        if (node.left.kind !== 'Identifier') {
            throw new Error('Only identifiers are supported on LHS of assignement');
        }
        ctx.currentBlock.push({
            kind: 'STORE',
            args: [
                node.left.text
            ]
        });
    },
    Expressions(node, cb, ctx) {
        node.expressions.forEach((expression, index) => {
            cb(expression);
            if (index < node.expressions.length - 1) {
                ctx.currentBlock.push({
                    kind: 'POP'
                });
            }
        });
    },
    NativeOperation(node, cb, ctx) {
        node.arguments.forEach(expression => {
            cb(expression);
        });
        ctx.currentBlock.push({
            kind: node.operation
        });
    }
};

function compile(source) {
    return compileAst(parseExpression(source));
}

function compileNode(compilers, node, ctx) {
    if (!compilers[node.kind]) {
        console.log('Compiler: Node kind not supported: ' + node.kind);
        return;
    }
    compilers[node.kind](node, node => compileNode(compilers, node, ctx), ctx);
}

function compileAst(ast) {
    const functions = {
        _main: {
            locals: {},
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
