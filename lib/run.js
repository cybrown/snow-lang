const {compileAst} = require('./compile');
const {parseProgram} = require('./parser');
const {desugarize} = require('./desugarizer');

function runInstruction(vm, opcodes) {
    const frame = currentFrame(vm);
    const instruction = opcodes[frame.func].blocks[frame.block][frame.index];
    //console.log(`RUN ${frame.func} / ${frame.block} / ${frame.index} : ${instruction.kind} ${(instruction.args || []).join(', ')}`);
    switch (instruction.kind) {
        case 'CONST':
            frame.stack.push(Number(instruction.args[0]));
            frame.index++;
            break;
        case 'ADD':
            frame.stack.push(frame.stack.pop() + frame.stack.pop());
            frame.index++;
            break;
        case 'MUL':
            frame.stack.push(frame.stack.pop() * frame.stack.pop());
            frame.index++;
            break;
        case 'SUB': {
            const a = frame.stack.pop();
            const b = frame.stack.pop();
            frame.stack.push(b - a);
            frame.index++;
            break;
        }
        case 'STACK_LOAD': {
            const name = instruction.args[0];
            if (opcodes[frame.func].locals[name]) {
                frame.stack.push(frame.locals[name]);
            } else if (opcodes[frame.func].parameters.indexOf(name) >= 0) {
                const index = opcodes[frame.func].parameters.indexOf(name);
                frame.stack.push(frame.stack[index]);
            } else if (vm.globals.hasOwnProperty(name)) {
                frame.stack.push(vm.globals[name]);
            } else {
                throw new Error('Unknown variable to load: ' + name);
            }
            frame.index++;
            break;
        }
        case 'STACK_STORE': {
            const name = instruction.args[0];
            if (opcodes[frame.func].locals[name]) {
                frame.locals[name] = frame.stack[frame.stack.length - 1];
            } else if (opcodes[frame.func].parameters.indexOf(name) >= 0) {
                const index = opcodes[frame.func].parameters.indexOf(name);
                frame.stack[index] = frame.stack[frame.stack.length - 1];
            } else if (vm.globals.hasOwnProperty(name)) {
                vm.globals[name] = frame.stack[frame.stack.length - 1];
            } else {
                throw new Error('Unknown variable to store: ' + name);
            }
            frame.index++;
            break;
        }
        case 'BRANCH_COND': {
            const condition = frame.stack.pop();
            const ifTrue = instruction.args[0];
            const ifFalse = instruction.args[1];
            frame.index = 0;
            frame.block = condition ? ifTrue : ifFalse;
            break;
        }
        case 'BRANCH': {
            frame.index = 0;
            frame.block = instruction.args[0];
            break;
        }
        case 'CALL': {
            const oldFrame = frame;
            const newFrame = createFrame(instruction.args[0], '_main');
            vm.stackFrame.push(newFrame);
            for (let i = 0; i < instruction.args[1]; i++) {
                newFrame.stack.unshift(oldFrame.stack.pop());
            }
            oldFrame.index++;
            break;
        }
        case 'RETURN': {
            if (vm.stackFrame.length === 1) {
                return true;
            }
            const result = frame.stack[frame.stack.length - 1];
            vm.stackFrame.pop();
            vm.stackFrame[vm.stackFrame.length - 1].stack.push(result);
            break;
        }
        case 'POP': {
            frame.stack.pop();
            frame.index++;
            break;
        }
        case 'PUTCHAR': {
            process.stdout.write(String.fromCharCode(frame.stack.pop()));
            frame.stack.push(0);
            frame.index++;
            break;
        }
        default:
            throw new Error('Unknown instruction kind: <' + instruction.kind + '>');
    }
}

function eval(source, globals = {}) {
    return run(compileAst(desugarize(parseProgram(source))), globals);
}

function createFrame(func, block) {
    return {
        stack: [],
        locals: [],
        index: 0,
        func,
        block
    };
}

function createVm(globals) {
    return {
        stackFrame: [createFrame('_main', '_main')],
        globals
    };
}

function currentFrame(vm) {
    return vm.stackFrame[vm.stackFrame.length - 1];
}

function run(opcodes, globals = {}) {
    const vm = createVm(globals);
    while (true) {
        if (runInstruction(vm, opcodes)) {
            break;
        }
    }
    if (currentFrame(vm).stack.length > 1) {
        console.log('Warning: program termination with stack.length > 1');
        console.log(currentFrame(vm).stack)
    }
    if (currentFrame(vm).stack.length === 0) {
        console.log('Warning: program termination with empty stack');
    }
    return currentFrame(vm).stack[currentFrame(vm).stack.length - 1];
}

module.exports.eval = eval;
module.exports.run = run;
