import {optWhitespace, seq} from 'parsimmon';
import { Opcodes } from './model';

export function dumpOpcodes(bc: Opcodes) {
    Object.keys(bc).forEach(funcName => {
        console.log(`${funcName} (${bc[funcName].parameters.join(', ')})`);
        Object.keys(bc[funcName].blocks).forEach(blockName => {
            console.log('  ' + blockName);
            bc[funcName].blocks[blockName].forEach(instr => {
                console.log(`    ${instr.kind} ${(instr.args || []).join(', ')}`)
            })
        });
    });
}
