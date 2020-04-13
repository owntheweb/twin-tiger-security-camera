/**
 * Make working with system commands a bit simpler.
 */

import { spawn } from 'child_process';
import mv from 'mv';
import { promisify } from 'util';

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

  /**
   * Move a file to a new location. Using mv, this will attempt a mv command, however
   * this could fail with docker volumes and will fallback to the mv module streaming
   * data to the new location as needed.
   * @param filePath - Full path to file
   * @param destinationFilePath - Full path to file's new destination
   */
  /*
  public static moveFile = (filePath: string, destinationFilePath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      mv(filePath, destinationFilePath, err => {
        if (!err) {
          resolve();
        } else {
          console.error('moveFile err', err);
          reject(err);
        }
      });
    });
  }
  */

  public static moveFile = promisify(mv);
}