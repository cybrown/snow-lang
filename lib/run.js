const {compile} = require('./compile');

function runInstruction(instruction, vm) {
    switch (instruction.kind) {
        case 'CONST':
            vm.stack.push(Number(instruction.args[0]));
            break;
        case 'ADD':
            vm.stack.push(vm.stack.pop() + vm.stack.pop());
            break;
        case 'SUB': {
            const a = vm.stack.pop();
            const b = vm.stack.pop();
            vm.stack.push(b - a);
            break;
        }
        case 'LOAD': {
            const name = instruction.args[0];
            if (!vm.globals.hasOwnProperty(name)) {
                throw new Error('Unknown global variable: ' + name);
            }
            vm.stack.push(vm.globals[name]);
            break;
        }
        default:
            throw new Error('Unknown instruction kind: <' + instruction.kind + '>');
    }
}

function runInstructions(instructions, vm) {
    instructions.forEach(instruction => runInstruction(instruction, vm))
}

function run(source, globals = {}) {
    const vm = {
        stack: [],
        globals
    };
    const instructions = compile(source);
    runInstructions(instructions, vm);
    return vm.stack[0];
}

module.exports.run = run;
