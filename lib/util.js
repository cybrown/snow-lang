const {
    optWhitespace,
    seq
} = require('parsimmon');

const _ = optWhitespace;

const CreateBinaryLeft = (kind, nextParser, operator) => seq(
    nextParser,
    seq(
        operator.trim(_),
        nextParser
    ).trim(_).map(v => [v[0], v[1]]).many()
).map(([first, rest]) => rest.reduce((acc, ch) => ({
    kind: kind,
    operator: ch[0],
    left: acc,
    right: ch[1]
}), first));

function dumpOpcodes(bc) {
    Object.keys(bc).forEach(funcName => {
        console.log(funcName);
        Object.keys(bc[funcName].blocks).forEach(blockName => {
            console.log('  ' + blockName);
            bc[funcName].blocks[blockName].forEach(instr => {
                console.log(`    ${instr.kind} ${(instr.args || []).join(', ')}`)
            })
        });
    });
}

module.exports.CreateBinaryLeft = CreateBinaryLeft;
module.exports.dumpOpcodes = dumpOpcodes;
