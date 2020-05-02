import sinon from 'sinon';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { FileStack } from '../file-stack';

describe("FileStack: constructor", () => {
  it("should successfully initialize", () => {
    // with set options
    const fileStack = new FileStack();
    expect(fileStack).to.not.be.null;
  });
});

describe("FileStack: push", () => {
  it("should push", () => {
    const fileStack = new FileStack();
    const length = fileStack.push('/some/file.jpg');
    expect(length).to.equal(1);
  });
});

describe("FileStack: pop", () => {
  it("should pop", () => {
    const filePath = '/some/file.jpg';
    const fileStack = new FileStack();

    fileStack.push(filePath);
    
    const stackItem = fileStack.pop();
    expect(stackItem).to.equal(filePath);
  });
});

describe("FileStack: peek", () => {
  it("should peek at next item to be pulled/popped from stack", () => {
    const filePath1 = '/some/file1.jpg';
    const filePath2 = '/some/file2.jpg';
    const fileStack = new FileStack();
    fileStack.push(filePath1);
    fileStack.push(filePath2);
    const peekValue = fileStack.peek();
    expect(peekValue).to.equal(filePath2);
  });
});

describe("FileStack: length", () => {
  it("should return stack length", () => {
    const filePath1 = '/some/file1.jpg';
    const filePath2 = '/some/file2.jpg';
    const fileStack = new FileStack();
    fileStack.push(filePath1);
    fileStack.push(filePath2);
    const lengthValue = fileStack.length;
    expect(lengthValue).to.equal(2);
  });
});

describe("FileStack: isEmpty", () => {
  it("should return true if empty", () => {
    const fileStack = new FileStack();
    const isEmpty = fileStack.isEmpty();
    expect(isEmpty).to.be.true;
  });

  it("should return false if not empty", () => {
    const fileStack = new FileStack();
    fileStack.push('/some/file.jpg');
    const isEmpty = fileStack.isEmpty();
    expect(isEmpty).to.be.false;
  });
});

describe("FileStack: cancel", () => {
  it("should remove an item from anywhere in the stack", () => {
    const filePath1 = '/some/file1.jpg';
    const filePath2 = '/some/file2.jpg';
    const filePath3 = '/some/file3.jpg';
    const fileStack = new FileStack();
    fileStack.push(filePath1);
    fileStack.push(filePath2);
    fileStack.push(filePath3);
    fileStack.cancel(filePath2);
    const lengthValue = fileStack.length;
    expect(lengthValue).to.equal(2);
  });
});