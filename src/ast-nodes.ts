import { InstructionKind } from "./model";

export interface BaseNode {
    kind: string;
}

export interface ProgramNode extends BaseNode {
    kind: 'Program';
    functions: FunctionNode[];
}

export interface FunctionNode extends BaseNode {
    kind: 'FunctionDefinition';
    name: string;
    parameters: string[];
    locals?: LocalNode[];
    body: AstNode;
}

export interface LocalNode extends BaseNode {
    kind: 'Local';
    name: string;
}

export interface ParameterNode extends BaseNode {
    kind: 'Parameter';
}

export interface CallNode extends BaseNode {
    kind: 'Call';
    args: AstNode[];
    caller: IdentifierNode;
}

export interface BinaryNode extends BaseNode {
    kind: 'Binary';
    operator: string;
    left: AstNode;
    right: AstNode;
}

export interface IdentifierNode extends BaseNode {
    kind: 'Identifier';
    text: string;
}

export interface NumberLiteralNode extends BaseNode {
    kind: 'NumberLiteral';
    value: number;
}

export interface IfNode extends BaseNode {
    kind: 'If';
    condition: AstNode;
    ifTrue: AstNode;
    ifFalse: AstNode;
}

export interface AssignementNode extends BaseNode {
    kind: 'Assignement';
    right: AstNode;
    left: AstNode;
}

export interface ExpressionsNode extends BaseNode {
    kind: 'Expressions';
    expressions: AstNode[];
}

export interface NativeOperationNode extends BaseNode {
    kind: 'NativeOperation';
    arguments: AstNode[];
    operation: InstructionKind;
}

export interface ArrayLiteralNode extends BaseNode {
    kind: 'ArrayLiteral';
    values: NumberLiteralNode[];
}

export interface IndexNode extends BaseNode {
    kind: 'Index';
    expression: AstNode;
    index: AstNode[];
}

export interface StringLiteralNode extends BaseNode {
    kind: 'StringLiteral';
    text: string;
}

export interface VarDeclarationNode extends BaseNode {
    kind: 'VarDeclaration';
}

export interface ExpressionsAndVarDeclarationsNode extends BaseNode {
    kind: 'ExpressionsAndVarDeclarations';
    expressions: AstNode[];
}

export interface ProgramWithExpressionsNode extends BaseNode {
    kind: 'ProgramWithExpressions';
    expressions: (ExpressionNode | FunctionNode)[];
}

export type ExpressionNode = CallNode
                           | BinaryNode
                           | IdentifierNode
                           | NumberLiteralNode
                           | IfNode
                           | AssignementNode
                           | ExpressionsNode
                           | NativeOperationNode
                           | ArrayLiteralNode
                           | IndexNode
                           | StringLiteralNode
                           ;

export type AstNode = ProgramNode
                    | FunctionNode
                    | LocalNode
                    | ParameterNode
                    | VarDeclarationNode
                    | ExpressionsAndVarDeclarationsNode
                    | ProgramWithExpressionsNode
                    | ExpressionNode
                    ;
