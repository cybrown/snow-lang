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

module.exports.CreateBinaryLeft = CreateBinaryLeft;
