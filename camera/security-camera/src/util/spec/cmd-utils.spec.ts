import sinon from 'sinon';
import child_process from 'child_process';
import stream from 'stream';
import events from 'events';
import mv from 'mv';
import fs from 'fs';
import util from 'util';
import { describe, it } from 'mocha';
import { CmdUtils } from '../cmd-utils';
import chaiAsPromised from 'chai-as-promised';
import proxyquire from 'proxyquire';

// See: https://stackoverflow.com/questions/50410530/how-to-stub-a-promisified-method-using-sinon-js
import { expect } from 'chai';
/*
import chai from 'chai';
chai.use(chaiAsPromised);
const expect = chai.expect;
*/

describe("CmdUtils: spawnAsPromise", () => {
  // Thanks: https://stackoverflow.com/questions/26839932/how-to-mock-the-node-js-child-process-spawn-function
  it("should run successfully", async() => {
    const sandbox = sinon.createSandbox();
    try {
      const CMD = 'foo';
      const ARGS = ['--bar'];
      const OPTS = { cwd: '/var/fubar' };

      const STDERR_TEXT = 'Some diag stuff...';
      const STDOUT_TEXT = 'Some output stuff...';

      const proc = <child_process.ChildProcess> new events.EventEmitter();
      proc.stdout = <stream.Readable> new events.EventEmitter();
      proc.stderr = <stream.Readable> new events.EventEmitter();

      // Stub out child process, returning our fake child process
      sandbox.stub(child_process, 'spawn')
          .returns(proc)    
          .calledOnceWith(CMD, ARGS, OPTS);

      // Launch process
      const p = CmdUtils.spawnAsPromise(CMD, ARGS);

      // Simulate spawn output
      proc.stderr.emit('data', STDERR_TEXT);
      proc.stdout.emit('data', STDOUT_TEXT);

      // Exit program, 0 = success, !0 = failure
      proc.emit('close', 0);

      // The close should get rid of the process
      const results = await p;
      expect(results).equal(STDERR_TEXT + STDOUT_TEXT);
    } finally {
      sandbox.restore();
    }
  });
});

// TODO: This is still calling mv for real. Seek professional help.
xdescribe("CmdUtils: moveFile", () => {
  it("should call mv as promise", () => {
    const sandbox = sinon.createSandbox();
    try {
      // mv is dated and doesn't have methods other than the import itself.
      const stubHelper = { mv };
      sinon.stub(stubHelper, 'mv').returns(undefined);
      sinon.stub(util, 'promisify').resolves(undefined);
      expect(CmdUtils.moveFile('/some/file.jpg', '/new/place/file.jpg')).to.eventually.be.undefined;
    } finally {
      sandbox.restore();
    }
  });
});

// TODO: This is still calling unlink for real. Seek professional help.
xdescribe("CmdUtils: deleteFile", () => {
  it("should call fs.unlink as promise", async () => {
    const sandbox = sinon.createSandbox();
    try {
      sandbox.stub(fs, 'unlink').returns(undefined);
      sandbox.stub(util, 'promisify').resolves(undefined);
      try {
        const results = await CmdUtils.deleteFile('/some/file.jpg');
        expect(results).to.be.undefined;
      } catch (err) {
        // fail
        console.log(err.message);
        expect('Should not have seen this message.').to.be.true;
      }
    } finally {
      sandbox.restore();
    }
  });
});