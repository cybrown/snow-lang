const assert = require('assert');
const {eval} = require('./lib/run');

let mismatch = 0;
let total = 0;
let created = 0;

verify(3, '1+2');
verify(40, 'abc-2', {abc: 42});
verify(4, 'if 1 {a} else {b}', {a: 4});
verify(3, `
    fun abc() {
        4+5
    };
    abc();
    3
`);
verify(9, `
    fun abc() {
        4+5
    };
    abc()
`);
verify(42, `
    fun addOne(a) {
        a+1
    };
    addOne(41)
`);
verify(720, `
    fun fact(a) {
        if (a) {
            a * fact(a - 1)
        } else {
            1
        }
    };
    fact(6)
`);
verify(6, `a = a + 5; a`, {a: 1});
verify(10, `
    fun abc(bfg) {
        bfg = bfg + 5;
        bfg
    };
    abc(5)
`);
verify(11, `
    fun abc(bfg) {
        var a;
        a = 6;
        var b;
        b = bfg + a;
        b
    };
    abc(5)
`);

function verify(actual, expr, globals) {
    total++;
    try {
        assert.equal(actual, eval(expr, globals));
    } catch (err) {
        if (err) {
            console.log('MISMATCH:', err.message);
        }
        mismatch++;
    }
}

console.log(`Eval test report: ${mismatch} mismatches, ${total} total`);
