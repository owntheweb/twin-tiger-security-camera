import sinon from 'sinon';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { RaspistillManager } from '../raspistill-manager';
import { RaspistillManagerOptions } from '../model/raspistill-manager-options';
import { RaspistillExposure } from '../model/raspistill-exposure';
import { CmdUtils } from '../util/cmd-utils';

const raspistillOptions: RaspistillManagerOptions = {
  imageWidth: 100,
  imageHeight: 100,
  imageQuality: 75,
  imageRotation: 0,
  thumbWidth: 100,
  thumbHeight: 100,
  raspicamExposure: RaspistillExposure.SPORTS,
  settingResetInterval: 300000,
};

// TODO: Confirm this is even needed or if there's better way to test.
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

describe("RaspistillManager: resetRaspistill", () => {
  it("should kill raspistill process and start raspistill again", async () => {
    const sandbox = sinon.createSandbox();
    try {

      // Extend class to call protected (yet public API) method
      class TestRaspistillManager extends RaspistillManager {
        // Override protected startRaspistill to prevent it from running again and again.
        // TODO: How do I spy/mock this? Even though it's public here, getting errors when plugging in sinon.
        startRaspistill = async (): Promise<void> => {
          return Promise.resolve();
        }
        
        public testResetRaspistill = () => {
          this.resetRaspistill();
        }
      }

      // this should be called once (while removing startRaspistill call to it to prevent recursion for test)
      const spawnStub = sandbox.stub(CmdUtils, 'spawnAsPromise').callsFake((command, args) => {
        return Promise.resolve('ok!');
      });

      const testRaspistillManager = new TestRaspistillManager({});
      await testRaspistillManager.testResetRaspistill();

      expect(spawnStub.calledOnce).to.be.true;
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