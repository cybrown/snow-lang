import { Opcodes, VirtualMachine, Frame, BinaryInstruction, BinaryProgram } from "./model";

const {compileAst} = require('./compile');
const {parseProgram} = require('./parser');
const {desugarize} = require('./desugarizer');

function stackPop<T>(stack: T[]): T {
    const value = stack.pop();
    if (value === undefined) {
        throw new Error('Stack underflow');
    }
    return value;
}

function instrArgString(instruction: BinaryInstruction, index: number) {
    if (!instruction.args) {
        throw new Error('No instruction arguments');
    }
    const value = instruction.args[index];
    if (typeof value !== 'string') {
        throw new Error('Instruction arg must be a string');
    }
    return value;
}

function instrArgNumber(instruction: BinaryInstruction, index: number) {
    if (!instruction.args) {
        throw new Error('No instruction arguments');
    }
    const value = Number(instruction.args[index]);
    if (isNaN(value)) {
        throw new Error('Instruction arg must be a number, got ' + instruction.args[index]);
    }
    return value;
}

function runInstruction(vm: VirtualMachine, opcodes: Opcodes) {
    const frame = currentFrame(vm);
    const instruction = opcodes[frame.func].blocks[frame.block][frame.index];
    //console.log(`RUN ${frame.func} / ${frame.block} / ${frame.index} : ${instruction.kind} ${(instruction.args || []).join(', ')}`);
    switch (instruction.kind) {
        case 'CONST':
            frame.stack.push(instrArgNumber(instruction, 0));
            frame.index++;
            break;
        case 'ADD':
            frame.stack.push(stackPop(frame.stack) + stackPop(frame.stack));
            frame.index++;
            break;
        case 'MUL':
            frame.stack.push(stackPop(frame.stack) * stackPop(frame.stack));
            frame.index++;
            break;
        case 'SUB': {
            const a = stackPop(frame.stack);
            const b = stackPop(frame.stack);
            frame.stack.push(b - a);
            frame.index++;
            break;
        }
        case 'STACK_LOAD': {
            const name = instrArgString(instruction, 0);
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
            const name = instrArgString(instruction, 0);
            if (typeof name != 'string') {
                throw new Error('Name is not a string');
            }
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
            const condition = stackPop(frame.stack);
            const ifTrue = instrArgString(instruction, 0);
            const ifFalse = instrArgString(instruction, 1);
            frame.index = 0;
            frame.block = condition ? ifTrue : ifFalse;
            break;
        }
        case 'BRANCH': {
            frame.index = 0;
            frame.block = instrArgString(instruction, 0);
            break;
        }
        case 'CALL': {
            const oldFrame = frame;
            const newFrame = createFrame(instrArgString(instruction, 0), '_main');
            vm.stackFrame.push(newFrame);
            for (let i = 0; i < instrArgNumber(instruction, 1); i++) {
                newFrame.stack.unshift(stackPop(oldFrame.stack));
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
            stackPop(frame.stack);
            frame.index++;
            break;
        }
        case 'PUTCHAR': {
            process.stdout.write(String.fromCharCode(stackPop(frame.stack)));
            frame.stack.push(0);
            frame.index++;
            break;
        }
        case 'PUTS': {
            const length = stackPop(frame.stack);
            const start = stackPop(frame.stack);
            process.stdout.write(Buffer.from(vm.memory, start, length));
            frame.index++;
            frame.stack.push(0);
            break;
        }
        case 'STORE': {
            const value = stackPop(frame.stack);
            const index = stackPop(frame.stack);
            const arr = new Uint8Array(vm.memory);
            arr[index] = value;
            frame.index++;
            frame.stack.push(value);
            break;
        }
        case 'LOAD': {
            const index = stackPop(frame.stack);
            const arr = new Uint8Array(vm.memory);
            frame.stack.push(arr[index]);
            frame.index++;
            break;
        }
        default:
            throw new Error('Unknown instruction kind: <' + instruction.kind + '>');
    }
}

function evaluate(source: string, globals = {}) {
    return run(compileAst(desugarize(parseProgram(source))), globals);
}

function createFrame(func: string, block: string): Frame {
    return {
        stack: [],
        locals: {},
        index: 0,
        func,
        block
    };
}

function createVm(globals: {[globalName: string]: number}): VirtualMachine {
    return {
        stackFrame: [createFrame('_main', '_main')],
        globals,
        memory: new ArrayBuffer(1024)
    };
}

function currentFrame(vm: VirtualMachine) {
    return vm.stackFrame[vm.stackFrame.length - 1];
}

function run(binary: BinaryProgram, globals = {}) {
    const vm = createVm(globals);
    const opcodes = binary.functions;
    const vmMemory = new Uint8Array(vm.memory);
    const binaryMemory = new Uint8Array(binary.memory);
    for (let i = 0; i < 1024; i++) {
        vmMemory[i] = binaryMemory[i];
    }
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

module.exports.eval = evaluate;
module.exports.run = run;
