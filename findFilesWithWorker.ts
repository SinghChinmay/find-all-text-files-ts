import * as fs from 'fs';
import * as path from 'path';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';

let fileCounter = 0;

function findTxtFiles(directoryPath: string) {
  try {
    const files = fs.readdirSync(directoryPath);
    files.forEach((file) => {
      const filePath = path.join(directoryPath, file);
      const fileStat = fs.statSync(filePath);
      if (fileStat.isDirectory()) {
        findTxtFiles(filePath);
      } else if (path.extname(filePath) === '.txt') {
        fileCounter++;
      }
    });
  } catch (error) {
    console.log("skipping due to error: " + error.message);
  }
}

if (isMainThread) {
  const startPath = process.argv[2] || '.';
  const worker = new Worker(__filename, { workerData: startPath });
  worker.on('message', (counter) => {
    console.log(`Found ${counter} .txt files`);
  });
  worker.on('error', (err) => {
    console.error('Worker error:', err);
  });
  worker.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Worker stopped with exit code ${code}`);
    }
  });
} else {
  findTxtFiles(workerData);
  if (parentPort) {
    parentPort.postMessage(fileCounter);
  }
}
