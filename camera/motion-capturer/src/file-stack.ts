/**
 * Follow a LIFO (last-in-first-out) pattern, adding extra
 * method to remove an item from the middle of the stack
 * (as helpful when raspistill-manager is deleting images
 * referenced in a stack over time)
 * thanks: https://dev.to/emmabostian/stacks-vs-queues-in-javascript-4d1o
 */

export class FileStack {
  private stack: string[] = [];

  public push(item: string) {
    return this.stack.push(item);
  }

  public pop() {
    return this.stack.pop();
  }

  public peek() {
    return this.stack[this.length - 1];
  }

  public get length() {
    return this.stack.length;
  }

  public isEmpty() {
    return this.length === 0;
  }

  // non-standard: Add ability to cancel a stack item with incoming events fo
  public cancel(canceledItem: string) {
    this.stack = this.stack.filter(stackItem => stackItem !== canceledItem);
  }
}