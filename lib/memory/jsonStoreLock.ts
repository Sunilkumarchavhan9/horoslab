const fileQueues = new Map<string, Promise<void>>();

export async function withFileLock<T>(
  filePath: string,
  task: () => Promise<T> | T,
): Promise<T> {
  // 1) get previous queued promise for this file (or resolved promise)
  const previous = fileQueues.get(filePath) ?? Promise.resolve();
  // 2) create a new "current" promise and store it in fileQueues
  let  release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  })
  const queued = previous.then(() => current);
  fileQueues.set(filePath, queued)
  // 3) await previous so this task runs exclusively
  await previous;
  try{
  // 4) run task and return its result
    return await task();
  }finally{
  // 5) always release current promise in finally
    release();

    // 6) cleanup map entry if queued is still latest
    if(fileQueues.get(filePath) === queued){
        fileQueues.delete(filePath);
    }
  }
}