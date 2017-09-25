const {
    optWhitespace,
    seq
} = require('parsimmon');

const CreateBinaryLeft = (kind, nextParser, operator) => seq(
    nextParser,
    seq(
        optWhitespace,
        operator,
        optWhitespace,
        nextParser
    ).map(v => [v[1], v[3]]).many()
).map(([first, rest]) => rest.reduce((acc, ch) => ({
    kind: kind,
    operator: ch[0],
    left: acc,
    right: ch[1]
}), first));

module.exports.CreateBinaryLeft = CreateBinaryLeft;
