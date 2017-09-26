const forEachChildrenFunctions = {
    Binary(node, cb) {
        cb(node.left);
        cb(node.right);
    },
    Identifier(node, cb) {},
    Number(node, cb) {},
    Call(node, cb) {
        cb(node.caller);
        node.args.forEach(arg => cb(arg));
    }
};

function forEachChildren(node, cb) {
    const f = forEachChildrenFunctions[node.kind];
    if (f == null) {
        throw new Error('Unknown node kind: ' + node.kind);
    }
    f(node, cb);
}

function visit(visitor, node, ctx) {
    if (visitor[node.kind] && visitor[node.kind].enter) {
        visitor[node.kind].enter(node, ctx);
    }
    forEachChildren(node, node => visit(visitor, node, ctx));
    if (visitor[node.kind] && visitor[node.kind].leave) {
        visitor[node.kind].leave(node, ctx);
    }
}

module.exports.visit = visit;
