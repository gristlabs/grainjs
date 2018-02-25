import * as sinon from 'sinon';

declare function assertResetSingleCall(spy: sinon.SinonSpy, context: any, ...args: any[]): void;
declare function assertResetFirstArgs(spy: sinon.SinonSpy, ...expFirstArgs: any[]): void;
