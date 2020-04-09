/**
 * 
 */

import { spawn } from 'child_process';

export class CmdUtils {
  // Return child_process.spawn as a promise.
  // Thank you: https://stackoverflow.com/questions/26839932/how-to-mock-the-node-js-child-process-spawn-function
  public static spawnAsPromise = (cmd: string, args: ReadonlyArray<string>): Promise<string> => {
    return new Promise((resolve, reject) => {
      let output: string = '';  
      const child = spawn(cmd, args);
      child.stdout.on('data', (data) => {
          output += data;
      });
      child.stderr.on('data', (data) => {
          output += data;
      });
      child.on('close', (code) => {
          (code === 0) ? resolve(output) : reject(output);
      });
      child.on('exit', (code) => {
        (code === 0) ? resolve(output) : reject(output);
      });
      child.on('error', (err) => {
          reject(err.toString());
      });
    });
  }
}