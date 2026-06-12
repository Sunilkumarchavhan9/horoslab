import { artifactRegistry, Artifact } from '../services/artifactRegistry';

async function run() {
  const a: Artifact = {
    id: 'uuid-test-1',
    type: 'preview',
    producer: 'coder',
    consumers: ['reviewer'],
    uri: 'artifact://uuid-test-1/preview',
    metadata: { createdAt: Date.now(), tags: ['test'] },
  };

  await artifactRegistry.register(a);
  const resolved = await artifactRegistry.resolve(a.uri);
  if (!resolved || resolved.id !== a.id) {
    throw new Error('artifact resolve failed');
  }

  const listed = await artifactRegistry.list();
  if (listed.length === 0) throw new Error('list empty');

  const removed = await artifactRegistry.remove(a.id);
  if (!removed) throw new Error('remove failed');

  console.log('artifactRegistry tests passed');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
