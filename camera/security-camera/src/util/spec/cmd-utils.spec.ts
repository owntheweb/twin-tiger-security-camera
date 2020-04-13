import sinon from 'sinon';
import child_process from 'child_process';
import stream from 'stream';
import events from 'events';
import mv from 'mv';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { CmdUtils } from '../cmd-utils';

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