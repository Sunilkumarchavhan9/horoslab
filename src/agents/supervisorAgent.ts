import { telemetryEvent } from '../lib/telemetry';

export type AgentRole = 'manager' | 'coder' | 'reviewer' | 'verifier';

export interface AgentInstance {
  id: string;
  role: AgentRole;
  model: string;
  busy: boolean;
}

export interface Task {
  id: string;
  title: string;
  payload?: any;
  priority?: number;
}

export class SupervisorAgent {
  private agentPool: Map<AgentRole, AgentInstance[]> = new Map();
  private taskQueue: Task[] = [];

  constructor() {
    this.agentPool.set('manager', []);
    this.agentPool.set('coder', []);
    this.agentPool.set('reviewer', []);
    this.agentPool.set('verifier', []);
  }

  registerAgent(agent: AgentInstance) {
    const list = this.agentPool.get(agent.role) || [];
    list.push(agent);
    this.agentPool.set(agent.role, list);
    telemetryEvent('supervisor.agent.register', { id: agent.id, role: agent.role });
  }

  enqueue(task: Task) {
    this.taskQueue.push(task);
    telemetryEvent('supervisor.task.enqueue', { taskId: task.id });
  }

  async orchestrate(task: Task) {
    telemetryEvent('supervisor.orchestrate.start', { taskId: task.id });
    // Very small demo: assign to a coder, simulate work, then reviewer, then verifier
    const coder = this.findAvailable('coder');
    if (!coder) {
      telemetryEvent('supervisor.orchestrate.blocked', { reason: 'no-coder' });
      throw new Error('No coder available');
    }

    // simulate handoff
    await this.simulateWork(coder, task);

    const reviewer = this.findAvailable('reviewer');
    if (!reviewer) throw new Error('No reviewer available');
    await this.simulateWork(reviewer, task);

    const verifier = this.findAvailable('verifier');
    if (!verifier) throw new Error('No verifier available');
    await this.simulateWork(verifier, task);

    telemetryEvent('supervisor.orchestrate.complete', { taskId: task.id });
  }

  findAvailable(role: AgentRole): AgentInstance | undefined {
    const list = this.agentPool.get(role) || [];
    return list.find((a) => !a.busy);
  }

  async simulateWork(agent: AgentInstance, task: Task) {
    agent.busy = true;
    telemetryEvent('supervisor.work.start', { agent: agent.id, role: agent.role, taskId: task.id });
    // simple delay to simulate work
    await new Promise((r) => setTimeout(r, 100));
    agent.busy = false;
    telemetryEvent('supervisor.work.complete', { agent: agent.id, role: agent.role, taskId: task.id });
  }
}

export default SupervisorAgent;
