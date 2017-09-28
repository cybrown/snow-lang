const {compileAst} = require('./compile');
const {parseProgram} = require('./parser');

function runInstruction(instruction, vm, opcodes) {
    //console.log(`RUN ${vm.currentFunction} / ${vm.currentBlock} / ${vm.index} : ${instruction.kind} ${(instruction.args || []).join(', ')}`);
    switch (instruction.kind) {
        case 'CONST':
            vm.stack.push(Number(instruction.args[0]));
            break;
        case 'ADD':
            vm.stack.push(vm.stack.pop() + vm.stack.pop());
            break;
        case 'MUL':
            vm.stack.push(vm.stack.pop() * vm.stack.pop());
            break;
        case 'SUB': {
            const a = vm.stack.pop();
            const b = vm.stack.pop();
            vm.stack.push(b - a);
            break;
        }
        case 'LOAD': {
            const name = instruction.args[0];
            if (opcodes[vm.currentFunction].parameters.indexOf(name) >= 0) {
                const index = opcodes[vm.currentFunction].parameters.indexOf(name);
                vm.stack.push(vm.stack[index]);
            } else if (vm.globals.hasOwnProperty(name)) {
                vm.stack.push(vm.globals[name]);
            } else {
                throw new Error('Unknown variable: ' + name);
            }
            break;
        }
        case 'STORE': {
            const name = instruction.args[0];
            if (opcodes[vm.currentFunction].parameters.indexOf(name) >= 0) {
                const index = opcodes[vm.currentFunction].parameters.indexOf(name);
                vm.stack[index] = vm.stack[vm.stack.length - 1];
            } else if (vm.globals.hasOwnProperty(name)) {
                vm.globals[name] = vm.stack[vm.stack.length - 1];
            } else {
                throw new Error('Unknown variable: ' + name);
            }
            break;
        }
        case 'BRANCH_COND': {
            const condition = vm.stack.pop();
            const ifTrue = instruction.args[0];
            const ifFalse = instruction.args[1];
            vm.index = 0;
            vm.currentBlock = condition ? ifTrue : ifFalse;
            return true;
        }
        case 'BRANCH': {
            vm.index = 0;
            vm.currentBlock = instruction.args[0];
            return true;
        }
        case 'CALL': {
            const oldStack = vm.stack;
            vm.callStack.push({
                currentFunction: vm.currentFunction,
                currentBlock: vm.currentBlock,
                index: vm.index + 1,
                stack: vm.stack
            });
            vm.index = 0;
            vm.stack = [];
            for (let i = 0; i < instruction.args[1]; i++) {
                vm.stack.unshift(oldStack.pop());
            }
            vm.currentBlock = '_main';
            vm.currentFunction = instruction.args[0];
            return true;
        }
        case 'POP': {
            vm.stack.pop();
            break;
        }
        default:
            throw new Error('Unknown instruction kind: <' + instruction.kind + '>');
    }
}

function runInstructions(instructions, vm, opcodes) {
    for (vm.index; vm.index < instructions.length; vm.index++) {
        if (runInstruction(instructions[vm.index], vm, opcodes)) {
            break;
        }
    }
}

function eval(source, globals = {}) {
    return run(compileAst(parseProgram(source)), globals);
}

function createVm(globals) {
    return {
        stack: [],
        callStack: [],
        globals,
        currentBlock: '_main',
        currentFunction: '_main',
        index: 0
    };
}

function run(opcodes, globals = {}) {
    const vm = createVm(globals);
    while (true) {
        runInstructions(opcodes[vm.currentFunction].blocks[vm.currentBlock], vm, opcodes);
        if (vm.index == opcodes[vm.currentFunction].blocks[vm.currentBlock].length) {
            if (vm.callStack.length === 0) {
                break;
            }
            const frame = vm.callStack.pop();
            vm.currentBlock = frame.currentBlock;
            vm.index = frame.index;
            vm.currentFunction = frame.currentFunction;
            frame.stack.push(vm.stack[vm.stack.length - 1]);
            vm.stack = frame.stack;
        }
    }
    if (vm.stack.length > 1) {
        console.log('Warning: program termination with stack.length > 1');
        console.log(vm.stack)
    }
    if (vm.stack.length === 0) {
        console.log('Warning: program termination with empty stack');
    }
    return vm.stack[vm.stack.length - 1];
}

module.exports.eval = eval;
module.exports.run = run;
