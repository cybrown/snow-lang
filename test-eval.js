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
assert.equal(42, eval(`
    fun addOne(a) {
        a+1
    };
    addOne(41)
`));
assert.equal(720, eval(`
    fun fact(a) {
        if (a) {
            a * fact(a - 1)
        } else {
            1
        }
    };
    fact(6)
`));
assert.equal(6, eval(`a = a + 5; a`, {a: 1}));
assert.equal(10, eval(`
    fun abc(bfg) {
        bfg = bfg + 5;
        bfg
    };
    abc(5)
`));
assert.equal(11, eval(`
    fun abc(bfg) {
        var a;
        a = 6;
        var b;
        b = bfg + a;
        b
    };
    abc(5)
`));
