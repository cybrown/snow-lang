import { ParameterNode } from "./ast-nodes";

export interface Opcodes {
    [functionName: string]: BinaryFunction;
}

export interface BinaryFunction {
    ifId: number;
    parameters: string[];
    blocks: {[blockName: string]: BinaryInstruction[]};
    locals: {[localName: string]: boolean};
}

export interface BinaryInstruction {
    kind: InstructionKind;
    args?: (string | number)[];
}

export type InstructionKind =
    'CONST' |
    'ADD' |
    'MUL' |
    'SUB' |
    'DIV' |
    'MOD' |
    'STACK_LOAD' |
    'STACK_STORE' |
    'BRANCH_COND' |
    'BRANCH' |
    'CALL' |
    'RETURN' |
    'POP' |
    'PUTCHAR' |
    'PUTS' |
    'STORE' |
    'LOAD';

export interface VirtualMachine {
    globals: {[globalName: string]: number};
    stackFrame: Frame[];
    memory: ArrayBuffer;
}

export interface Frame {
    stack: number[];
    locals: {[localName: string]: number};
    index: number;
    func: string;
    block: string;
}

export interface BinaryProgram {
    functions: Opcodes;
    memory: ArrayBuffer;
}
