const assert = require('assert');
const {run} = require('./lib/run');

assert.equal(3, run('1+2'));
assert.equal(40, run('abc-2', {abc: 42}));
