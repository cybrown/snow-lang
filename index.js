const {run} = require('./lib/run');

const result = run('toto-2', {
    toto: 42
});

console.log(result);
