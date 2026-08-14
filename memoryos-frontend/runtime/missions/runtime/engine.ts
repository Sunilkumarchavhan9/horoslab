import { RuntimeBus } from '../../kernel/runtime-bus';

export interface MissionStep {
 id: number;
 title: string;
 type: 'action' | 'communication' | 'verification' | 'decision';
 status: 'pending' | 'running' | 'completed' | 'failed';
 actors: string[];
 evidenceExpected?: boolean;
}

export interface MissionDefinition {
 id: string;
 title: string;
 objective: string;
 steps: MissionStep[];
 requiresApprovalBeforeLaunch: boolean;
}

export class MissionEngine {
 private activeMission: MissionDefinition | null = null;
 private currentStepIndex: number = -1;

 constructor() {
 // Listen for launch commands
 RuntimeBus.subscribe('LaunchMissionCommand', (event) => {
 const definition = event.payload as MissionDefinition;
 this.startMission(definition);
 });
 }

 private startMission(definition: MissionDefinition) {
 this.activeMission = JSON.parse(JSON.stringify(definition)); // Deep copy
 this.currentStepIndex = 0;
 
 RuntimeBus.publish({
 id: crypto.randomUUID(),
 runtime: 'mission',
 type: 'MissionStarted',
 payload: { missionId: definition.id, title: definition.title },
 timestamp: new Date()
 });

 this.executeNextStep();
 }

 private executeNextStep() {
 if (!this.activeMission || this.currentStepIndex >= this.activeMission.steps.length) {
 // Mission Complete
 RuntimeBus.publish({
 id: crypto.randomUUID(),
 runtime: 'mission',
 type: 'MissionComplete',
 payload: { missionId: this.activeMission?.id, success: true },
 timestamp: new Date()
 });
 return;
 }

 const step = this.activeMission.steps[this.currentStepIndex];
 step.status = 'running';

 RuntimeBus.publish({
 id: crypto.randomUUID(),
 runtime: 'mission',
 type: 'MissionStepStarted',
 payload: { missionId: this.activeMission.id, stepId: step.id, stepTitle: step.title },
 timestamp: new Date()
 });

 // Simulate execution time for the step (1.5 seconds)
 setTimeout(() => {
 step.status = 'completed';

 if (step.evidenceExpected) {
 RuntimeBus.publish({
 id: crypto.randomUUID(),
 runtime: 'mission',
 type: 'EvidenceGenerated',
 payload: { missionId: this.activeMission?.id, stepId: step.id, type: 'Audit Log' },
 timestamp: new Date()
 });
 }

 RuntimeBus.publish({
 id: crypto.randomUUID(),
 runtime: 'mission',
 type: 'MissionStepCompleted',
 payload: { missionId: this.activeMission?.id, stepId: step.id, success: true },
 timestamp: new Date()
 });

 this.currentStepIndex++;
 this.executeNextStep();
 }, 1500);
 }
}

export const GlobalMissionEngine = new MissionEngine();
