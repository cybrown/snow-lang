const identity = x => x;

const desugarizeTopLevelExpressionsFunctions = {
    ProgramWithExpressions(node) {
        return {
            kind: 'Program',
            functions: node.expressions
                .filter(expression => expression.kind === 'FunctionDefinition')
                .map(n => desugarizeTopLevelExpressions(n))
                .concat({
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
    Number: identity,
    Assignement: identity,
    FunctionDefinition: identity
};

function desugarizeTopLevelExpressions(node) {
    const func = desugarizeTopLevelExpressionsFunctions[node.kind];
    if (!func) {
        console.log('Warning: can not desugarize top level expressions for node: ' + node.kind);
        return node;
    } else {
        return func(node);
    }
}

const desugarizeVarDeclarationsFunctions = {
    Program: (node, ctx) => Object.assign({}, node, {
        functions: node.functions.map(n => desugarizeVarDeclarations(n, ctx))
    }),
    Binary: (node, ctx) => Object.assign({}, node, {
        left: desugarizeVarDeclarations(node.left, ctx),
        right: desugarizeVarDeclarations(node.right, ctx)
    }),
    Call: (node, ctx) => Object.assign({}, node, {
        caller: desugarizeVarDeclarations(node.caller, ctx),
        args: node.args.map(n => desugarizeVarDeclarations(n, ctx))
    }),
    Identifier: identity,
    If: (node, ctx) => Object.assign({}, node, {
        condition: desugarizeVarDeclarations(node.condition, ctx),
        ifTrue: desugarizeVarDeclarations(node.ifTrue, ctx),
        ifFalse: desugarizeVarDeclarations(node.ifFalse, ctx)
    }),
    Number: identity,
    Assignement: (node, ctx) => Object.assign({}, node, {
        left: desugarizeVarDeclarations(node.left, ctx),
        right: desugarizeVarDeclarations(node.right, ctx)
    }),
    FunctionDefinition: (node, ctx) => {
        ctx.currentFunction = {
            locals: []
        };
        return Object.assign({}, node, {
            body: desugarizeVarDeclarations(node.body, ctx),
            locals: ctx.currentFunction.locals
        });
    },
    ExpressionsAndVarDeclarations: (node, ctx) => {
        const expressions = node.expressions
            .map(n => desugarizeVarDeclarations(n, ctx))
            .filter(e => e.kind !== 'VarDeclaration')
        return Object.assign({}, node, {
            kind: 'Expressions',
            expressions
        });
    },
    VarDeclaration: (node, ctx) => {
        ctx.currentFunction.locals.push(node);
        return node;
    }
};

function desugarizeVarDeclarations(node, ctx) {
    const func = desugarizeVarDeclarationsFunctions[node.kind];
    if (!func) {
        console.log('Warning: can not desugarize var declarations for node: ' + node.kind);
        return node;
    } else {
        return func(node, ctx);
    }
}

function desugarize(ast) {
    const ctx = {};
    return Object.assign({}, ast, {
        value: desugarizeVarDeclarations(desugarizeTopLevelExpressions(ast.value, ctx), ctx)
    });
}

module.exports.desugarize = desugarize;
