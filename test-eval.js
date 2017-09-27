const assert = require('assert');
const {eval} = require('./lib/run');

assert.equal(3, eval('1+2'));
assert.equal(40, eval('abc-2', {abc: 42}));
assert.equal(4, eval('if 1 {a} else {b}', {a: 4}));
assert.equal(3, eval(`
    fun abc() {
        4+5
    };
    abc();
    3
`));
assert.equal(9, eval(`
    fun abc() {
        4+5
    };
    abc()
`));
