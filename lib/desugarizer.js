const identity = x => x;

const desugarizers = {
    ProgramWithExpressions(node) {
        return {
            kind: 'Program',
            functions: node.expressions
                .filter(expression => expression.kind === 'FunctionDefinition')
                .map(n => desugarizeNode(n))
                .concat({
                    kind: 'FunctionDefinition',
                    name: '_main',
                    parameters: [],
                    body: {
                        kind: 'Expressions',
                        expressions: node.expressions
                            .filter(expression => expression.kind !== 'FunctionDefinition')
                            .map(n => desugarizeNode(n))
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

function desugarizeNode(node) {
    const func = desugarizers[node.kind];
    if (!func) {
        console.log('Warning: can not desugarize node: ' + node.kind);
        return node;
    } else {
        return func(node);
    }
}

function desugarize(ast) {
    return Object.assign({}, ast, {
        value: desugarizeNode(ast.value)
    });
}

module.exports.desugarize = desugarize;
