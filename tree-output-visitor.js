const fs = require('fs');
const {parseExpression} = require('./lib/parser');
const {visit} = require('./lib/visit');

const ast = parseExpression('(a+b)*(c-f(3))').value;

visit({
    Call: {
        enter(node, ctx) {
            console.log(`${ctx.spaces}Call`)
            ctx.spaces += '  ';
        },
        leave(node, ctx) {
            ctx.spaces = ctx.spaces.substring(0, ctx.spaces.length - 2);
        }
    },
    Binary: {
        enter(node, ctx) {
            console.log(`${ctx.spaces}Binary (${node.operator})`)
            ctx.spaces += '  ';
        },
        leave(node, ctx) {
            ctx.spaces = ctx.spaces.substring(0, ctx.spaces.length - 2);
        }
    },
    Identifier: {
        enter(node, ctx) {
            console.log(`${ctx.spaces}Identifier (${node.text})`)
            ctx.spaces += '  ';
        },
        leave(node, ctx) {
            ctx.spaces = ctx.spaces.substring(0, ctx.spaces.length - 2);
        }
    },
    Number: {
        enter(node, ctx) {
            console.log(`${ctx.spaces}Number (${node.value})`)
            ctx.spaces += '  ';
        },
        leave(node, ctx) {
            ctx.spaces = ctx.spaces.substring(0, ctx.spaces.length - 2);
        }
    }
}, ast, {
    spaces: ''
});
