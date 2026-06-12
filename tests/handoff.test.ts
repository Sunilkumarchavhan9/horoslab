import { generateHandoff } from '../tools/handoff/generateHandoff';

function run() {
  const h = generateHandoff({ taskId: 'TEST-1', source: 'manager', target: 'coder' });
  if (!h.handoffId) throw new Error('no handoffId');
  if (h.taskId !== 'TEST-1') throw new Error('taskId mismatch');
  console.log('handoff generator test passed');
}

run();
