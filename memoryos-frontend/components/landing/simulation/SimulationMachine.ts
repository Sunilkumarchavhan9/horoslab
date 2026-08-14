import { setup, assign } from 'xstate';

export type ViewMode = 'institution' | 'authority' | 'causality' | 'evidence' | 'counterfactual' | 'lineage';

export type SimulationContext = {
  viewMode: ViewMode;
  progress: number; // 0 to 1
  counterfactualDecision: 'pending' | 'approve' | 'reject';
  isPlaying: boolean;
};

export const simulationMachine = setup({
  types: {
    context: {} as SimulationContext,
    events: {} as
      | { type: 'PLAY' }
      | { type: 'PAUSE' }
      | { type: 'SET_PROGRESS'; value: number }
      | { type: 'SET_VIEW_MODE'; mode: ViewMode }
      | { type: 'DECIDE_COUNTERFACTUAL'; decision: 'approve' | 'reject' },
  },
  actions: {
    setProgress: assign({
      progress: ({ event }) => (event.type === 'SET_PROGRESS' ? event.value : 0),
    }),
    setViewMode: assign({
      viewMode: ({ event }) => (event.type === 'SET_VIEW_MODE' ? event.mode : 'institution'),
    }),
    setDecision: assign({
      counterfactualDecision: ({ event }) => (event.type === 'DECIDE_COUNTERFACTUAL' ? event.decision : 'pending'),
    }),
    play: assign({ isPlaying: true }),
    pause: assign({ isPlaying: false }),
  },
  guards: {
    isMission: ({ context }) => context.progress < 0.1,
    isConstitution: ({ context }) => context.progress >= 0.1 && context.progress < 0.25,
    isOrganization: ({ context }) => context.progress >= 0.25 && context.progress < 0.4,
    isExecution: ({ context }) => context.progress >= 0.4 && context.progress < 0.55,
    isCounterfactual: ({ context }) => context.progress >= 0.55 && context.progress < 0.7,
    isEvidence: ({ context }) => context.progress >= 0.7 && context.progress < 0.85,
    isSettlement: ({ context }) => context.progress >= 0.85,
  }
}).createMachine({
  id: 'simulation',
  initial: 'idle',
  context: {
    viewMode: 'institution',
    progress: 0,
    counterfactualDecision: 'pending',
    isPlaying: false,
  },
  on: {
    PLAY: { actions: 'play' },
    PAUSE: { actions: 'pause' },
    SET_VIEW_MODE: { actions: 'setViewMode' },
    DECIDE_COUNTERFACTUAL: { actions: 'setDecision' },
    SET_PROGRESS: { 
      actions: 'setProgress',
      target: '.evaluating'
    }
  },
  states: {
    idle: {},
    evaluating: {
      always: [
        { guard: 'isSettlement', target: 'settlement' },
        { guard: 'isEvidence', target: 'independent_evidence' },
        { guard: 'isCounterfactual', target: 'counterfactual_branch' },
        { guard: 'isExecution', target: 'governed_execution' },
        { guard: 'isOrganization', target: 'organization_topology' },
        { guard: 'isConstitution', target: 'constitution_generation' },
        { guard: 'isMission', target: 'mission_arrival' },
      ]
    },
    mission_arrival: {},
    constitution_generation: {},
    organization_topology: {},
    governed_execution: {},
    counterfactual_branch: {},
    independent_evidence: {},
    settlement: {},
  }
});
