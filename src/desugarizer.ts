import { AstNode, ProgramNode, BaseNode, BinaryNode, CallNode, IfNode, AssignementNode, FunctionNode, IndexNode, NativeOperationNode, StringLiteralNode, VarDeclarationNode, ExpressionsAndVarDeclarationsNode, IdentifierNode, NumberLiteralNode, ArrayLiteralNode } from "./ast-nodes";

function identity<T>(x: T): T {
    return x;
}

const desugarizeTopLevelExpressionsFunctions: {
    [name: string]: (node: AstNode) => AstNode
} = {
    ProgramWithExpressions(node: AstNode): ProgramNode {
        if (node.kind !== 'ProgramWithExpressions') {
            throw new Error('Program node was expected');
        }
        return <any> {
            kind: 'Program',
            functions: node.expressions
                .filter(expression => expression.kind === 'FunctionDefinition')
                .map(n => desugarizeTopLevelExpressions(n))
                .concat(<any> {
                    kind: 'FunctionDefinition',
                    name: '_main',
                    parameters: [],
                    body: {
                        kind: 'ExpressionsAndVarDeclarations',
                        expressions: node.expressions
                            .filter(expression => expression.kind !== 'FunctionDefinition')
                            .map(n => desugarizeTopLevelExpressions(n))
                    }
                })
        };
    },
    Binary: identity,
    Call: identity,
    Identifier: identity,
    If: identity,
    NumberLiteral: identity,
    Assignement: identity,
    FunctionDefinition: identity,
    Index: identity,
    ExpressionsAndVarDeclarations: identity,
    NativeOperation: identity,
    VarDeclaration: identity,
    StringLiteral: identity
};

function desugarizeTopLevelExpressions(node: AstNode): AstNode {
    const func = desugarizeTopLevelExpressionsFunctions[node.kind];
    if (!func) {
        console.log('Warning: can not desugarize top level expressions for node: ' + node.kind);
        return node;
    } else {
        return func(node);
    }
}

interface Context {
    currentFunction?: {
        locals: VarDeclarationNode[];
    };
}

type VisitorMember<T extends BaseNode> = (node: T, ctx: Context) => AstNode;

interface Visitor {
    Program: VisitorMember<ProgramNode>;
    Binary: VisitorMember<BinaryNode>;
    Call: VisitorMember<CallNode>;
    Identifier: VisitorMember<IdentifierNode>;
    If: VisitorMember<IfNode>;
    NumberLiteral: VisitorMember<NumberLiteralNode>;
    Assignement: VisitorMember<AssignementNode>;
    FunctionDefinition: VisitorMember<FunctionNode>;
    ExpressionsAndVarDeclarations: VisitorMember<ExpressionsAndVarDeclarationsNode>;
    VarDeclaration: VisitorMember<VarDeclarationNode>;
    Index: VisitorMember<IndexNode>;
    NativeOperation: VisitorMember<NativeOperationNode>;
    StringLiteral: VisitorMember<StringLiteralNode>;
}

const desugarizeVarDeclarationsFunctions: Visitor = {
    Program: (node: ProgramNode, ctx: Context) => Object.assign({}, node, {
        functions: node.functions.map(n => desugarizeVarDeclarations(n, ctx))
    }),
    Binary: (node: BinaryNode, ctx: Context) => Object.assign({}, node, {
        left: desugarizeVarDeclarations(node.left, ctx),
        right: desugarizeVarDeclarations(node.right, ctx)
    }),
    Call: (node: CallNode, ctx: Context) => Object.assign({}, node, {
        caller: desugarizeVarDeclarations(node.caller, ctx),
        args: node.args.map(n => desugarizeVarDeclarations(n, ctx))
    }),
    Identifier: identity,
    If: (node: IfNode, ctx: Context) => Object.assign({}, node, {
        condition: desugarizeVarDeclarations(node.condition, ctx),
        ifTrue: desugarizeVarDeclarations(node.ifTrue, ctx),
        ifFalse: desugarizeVarDeclarations(node.ifFalse, ctx)
    }),
    NumberLiteral: identity,
    Assignement: (node: AssignementNode, ctx: Context) => Object.assign({}, node, {
        left: desugarizeVarDeclarations(node.left, ctx),
        right: desugarizeVarDeclarations(node.right, ctx)
    }),
    FunctionDefinition: (node: FunctionNode, ctx: Context) => {
        ctx.currentFunction = {
            locals: []
        };
        return Object.assign({}, node, {
            body: desugarizeVarDeclarations(node.body, ctx),
            locals: ctx.currentFunction.locals
        });
    },
    ExpressionsAndVarDeclarations: (node: ExpressionsAndVarDeclarationsNode, ctx: Context) => {
        const expressions = node.expressions
            .map(n => desugarizeVarDeclarations(n, ctx))
            .filter(e => e.kind !== 'VarDeclaration')
        return Object.assign({}, node, {
            kind: 'Expressions',
            expressions
        });
    },
    VarDeclaration: (node: VarDeclarationNode, ctx: Context) => {
        if (!ctx.currentFunction) {
            throw new Error('No current function');
        }
        ctx.currentFunction.locals.push(node);
        return node;
    },
    Index: (node: IndexNode, ctx: Context) => Object.assign({}, node, {
        expression: desugarizeVarDeclarations(node.expression, ctx),
        index: node.index.map(n => desugarizeVarDeclarations(n, ctx))
    }),
    NativeOperation: (node: NativeOperationNode, ctx: Context) => Object.assign({}, node, {
        arguments: node.arguments.map(n => desugarizeVarDeclarations(n, ctx))
    }),
    StringLiteral: (node: StringLiteralNode, ctx: Context) => <ArrayLiteralNode> Object.assign({}, {
        kind: 'ArrayLiteral',
        values: [{kind: 'NumberLiteral', value: node.text.length}, ...node.text.split('').map(c => ({
            kind: 'NumberLiteral',
            value: c.charCodeAt(0)
        }))]
    })
};

function desugarizeVarDeclarations(node: AstNode, ctx: Context) {
    const func = (<any> desugarizeVarDeclarationsFunctions)[node.kind];
    if (!func) {
        console.log('Warning: can not desugarize var declarations for node: ' + node.kind);
        return node;
    } else {
        return func(node, ctx);
    }
}

export function desugarize(ast: {value: AstNode}) {
    const ctx: Context = {};
    return Object.assign({}, ast, {
        value: desugarizeVarDeclarations(desugarizeTopLevelExpressions(ast.value), ctx)
    });
}
