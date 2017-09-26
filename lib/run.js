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
        case 'BRANCH_COND': {
            const condition = vm.stack.pop();
            const ifTrue = instruction.args[0];
            const ifFalse = instruction.args[1];
            vm.currentBlock = condition ? ifTrue : ifFalse;
            return;
        }
        case 'BRANCH': {
            vm.currentBlock = instruction.args[0];
            return;
        }
        default:
            throw new Error('Unknown instruction kind: <' + instruction.kind + '>');
    }
}

function runInstructions(instructions, vm) {
    vm.currentBlock = null;
    instructions.forEach(instruction => runInstruction(instruction, vm))
}

function eval(source, globals = {}) {
    return run(compile(source), globals);
}

function run(opcodes, globals = {}) {
    const vm = {
        stack: [],
        globals,
        currentBlock: '_main'
    };
    while (vm.currentBlock != null) {
        runInstructions(opcodes[vm.currentBlock], vm);
    }
    return vm.stack[0];
}

module.exports.eval = eval;
module.exports.run = run;
