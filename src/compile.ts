import { ProgramNode, FunctionNode, CallNode, BinaryNode, IdentifierNode, NumberLiteralNode, IfNode, AssignementNode, ExpressionsNode, NativeOperationNode, ArrayLiteralNode, AstNode } from "./ast-nodes";
import { BinaryProgram, BinaryFunction, BinaryInstruction, InstructionKind } from "./model";

const {parseExpression} = require('./parser');

const opForOperator: {[operator: string]: InstructionKind} = {
    '+': 'ADD',
    '-': 'SUB',
    '*': 'MUL',
    '/': 'DIV',
    '%': 'MOD'
};

interface CompilationContext {
    functions: {
        [name: string]: BinaryFunction
    };
    currentFunction: BinaryFunction;
    currentBlock: BinaryInstruction[];
    initialMemory: ArrayBuffer;
    currentMemoryOffset: number;
}

interface VisitorCollection {
    [nodeName: string]: (node: AstNode, cb: VisitorCallback, ctx: CompilationContext) => void;
}

type VisitorCallback = (node: AstNode) => void;

const allCompilers: VisitorCollection = {
    Program(node: AstNode, cb: VisitorCallback, ctx: CompilationContext) {
        if (node.kind !== 'Program') {
            throw new Error('Expected Program');
        }
        node.functions.forEach(func => cb(func));
    },
    FunctionDefinition(node: AstNode, cb: VisitorCallback, ctx: CompilationContext) {
        if (node.kind !== 'FunctionDefinition') {
            throw new Error('Expected FunctionDefinition');
        }
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
    Call(node: AstNode, cb: VisitorCallback, ctx: CompilationContext) {
        if (node.kind !== 'Call') {
            throw new Error('Expected Call');
        }
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
    Binary(node: AstNode, cb: VisitorCallback, ctx: CompilationContext) {
        if (node.kind !== 'Binary') {
            throw new Error('Expected Binary');
        }
        cb(node.left);
        cb(node.right);
        ctx.currentBlock.push({
            kind: opForOperator[node.operator]
        });
    },
    Identifier(node: AstNode, cb: VisitorCallback, ctx: CompilationContext) {
        if (node.kind !== 'Identifier') {
            throw new Error('Expected Identifier');
        }
        ctx.currentBlock.push({
            kind: 'STACK_LOAD',
            args: [node.text]
        })
    },
    NumberLiteral(node: AstNode, cb: VisitorCallback, ctx: CompilationContext) {
        if (node.kind !== 'NumberLiteral') {
            throw new Error('Expected NumberLiteral')
        }
        ctx.currentBlock.push({
            kind: 'CONST',
            args: [node.value]
        })
    },
    If(node: AstNode, cb: VisitorCallback, ctx: CompilationContext) {
        if (node.kind !== 'If') {
            throw new Error('Expected If');
        }
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
    Assignement(node: AstNode, cb: VisitorCallback, ctx: CompilationContext) {
        if (node.kind !== 'Assignement') {
            throw new Error('Expected Assignement');
        }
        cb(node.right);
        if (node.left.kind !== 'Identifier') {
            throw new Error('Only identifiers supported on LHS of assignement');
        }
        ctx.currentBlock.push({
            kind: 'STACK_STORE',
            args: [
                node.left.text
            ]
        });
    },
    Expressions(node: AstNode, cb: VisitorCallback, ctx: CompilationContext) {
        if (node.kind !== 'Expressions') {
            throw new Error('Expected Expressions');
        }
        node.expressions.forEach((expression, index) => {
            cb(expression);
            if (index < node.expressions.length - 1) {
                ctx.currentBlock.push({
                    kind: 'POP'
                });
            }
        });
    },
    NativeOperation(node: AstNode, cb: VisitorCallback, ctx: CompilationContext) {
        if (node.kind !== 'NativeOperation') {
            throw new Error('Expected NativeOperation');
        }
        node.arguments.forEach(expression => {
            cb(expression);
        });
        ctx.currentBlock.push({
            kind: node.operation
        });
    },
    ArrayLiteral(node: AstNode, cb: VisitorCallback, ctx: CompilationContext) {
        if (node.kind !== 'ArrayLiteral') {
            throw new Error('Expected ArrayLiteral');
        }
        const arr = new Uint8Array(ctx.initialMemory);
        const initialAddress = ctx.currentMemoryOffset;
        node.values.forEach(value => {
            arr[ctx.currentMemoryOffset++] = Number(value.value);
        });
        ctx.currentBlock.push({
            kind: 'CONST',
            args: [initialAddress]
        });
    }
};

function compile(source: string): BinaryProgram {
    return compileAst(parseExpression(source));
}

function compileNode(compilers: VisitorCollection, node: AstNode, ctx: CompilationContext) {
    if (!compilers[node.kind]) {
        console.log('Compiler: Node kind not supported: ' + node.kind);
        return;
    }
    compilers[node.kind](node, node => compileNode(compilers, node, ctx), ctx);
}

function compileAst(ast: {value: AstNode}, initialMemorySize = 1024) {
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
    const ctx = {
        functions,
        currentBlock: functions._main.blocks._main,
        currentFunction: functions._main,
        initialMemory: new ArrayBuffer(initialMemorySize),
        currentMemoryOffset: 0
    };
    compileNode(allCompilers, ast.value, ctx);
    return {
        functions,
        memory: ctx.initialMemory
    };
}

module.exports.compile = compile;
module.exports.compileAst = compileAst;
