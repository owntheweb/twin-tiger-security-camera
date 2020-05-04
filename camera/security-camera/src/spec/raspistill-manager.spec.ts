import sinon from 'sinon';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { RaspistillManager } from '../raspistill-manager';
import { RaspistillManagerOptions } from '../model/raspistill-manager-options';
import { CmdUtils } from '../util/cmd-utils';

const raspistillOptions: RaspistillManagerOptions = {
  imageWidth: 100,
  imageHeight: 100,
  imageQuality: 75,
  imageRotation: 0,
  thumbWidth: 100,
  thumbHeight: 100
};

describe("RaspistillManager: constructor", () => {
  it("should successfully initialize", () => {
    // with default options
    const raspistillManager = new RaspistillManager({});
    expect(raspistillManager).to.not.be.null;

    // with set options
    const raspistillManager2 = new RaspistillManager(raspistillOptions);
    expect(raspistillManager2).to.not.be.null;
  });
});

// TODO: Not happy with this yet.
// Look for a better way to test or refactor. This method runs itself again on
// process exit in an effort to keep the process going. Test that the process
// gets started once, yet throw a fake error in the test to prevent the infinite
// loop that is intended.
describe("RaspistillManager: startRaspistill", () => {
  it("should start raspistill", async () => {
    const sandbox = sinon.createSandbox();
    try {

      // Extend class to call protected (yet public API) method
      class TestRaspistillManager extends RaspistillManager {
        public testStartRaspistill = () => {
          this.startRaspistill();
        }
      }

      // Prevent recursive method from calling itself. spawnAsPromise was called, stop there.
      const spawnStub = sandbox.stub(CmdUtils, 'spawnAsPromise').callsFake((command, args) => {
        return Promise.reject('intentional error');
      });

      try {
        const testRaspistillManager = new TestRaspistillManager({});
        await testRaspistillManager.testStartRaspistill();
        // fail if it gets here
        expect(true).to.be.false;
      } catch (err) {
        // pass
        expect(spawnStub.called).to.be.true;
      }
    } finally {
      sandbox.restore();
    }
  });
});

// TODO: Revisit as there may be an opportunity to refactor run()
xdescribe("RaspistillManager: run", () => {
  it("should run RaspistillManager", () => {
    
  });
});