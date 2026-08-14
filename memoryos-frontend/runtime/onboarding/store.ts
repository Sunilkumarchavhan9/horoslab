import { create } from 'zustand';

export type OnboardingStep = 'identity' | 'team' | 'connectors' | 'sync' | 'complete';

export interface OnboardingState {
  currentStep: OnboardingStep;
  institutionName: string;
  institutionPurpose: string;
  invitedEmails: string[];
  connectedApps: string[];
  isSyncing: boolean;
  syncProgress: number; // 0 to 100
  
  setStep: (step: OnboardingStep) => void;
  setInstitutionDetails: (name: string, purpose: string) => void;
  addInvite: (email: string) => void;
  removeInvite: (email: string) => void;
  connectApp: (appId: string) => void;
  disconnectApp: (appId: string) => void;
  setConnectedApps: (appIds: string[]) => void;
  startSync: () => void;
  setSyncProgress: (progress: number) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  currentStep: 'identity',
  institutionName: '',
  institutionPurpose: '',
  invitedEmails: [],
  connectedApps: [],
  isSyncing: false,
  syncProgress: 0,

  setStep: (step) => set({ currentStep: step }),
  
  setInstitutionDetails: (name, purpose) => set({ 
    institutionName: name, 
    institutionPurpose: purpose 
  }),
  
  addInvite: (email) => set((state) => ({ 
    invitedEmails: [...state.invitedEmails, email] 
  })),
  
  removeInvite: (email) => set((state) => ({
    invitedEmails: state.invitedEmails.filter(e => e !== email)
  })),
  
  connectApp: (appId) => set((state) => ({
    connectedApps: [...state.connectedApps, appId]
  })),
  
  disconnectApp: (appId) => set((state) => ({
    connectedApps: state.connectedApps.filter(id => id !== appId)
  })),

  setConnectedApps: (appIds) => set({
    connectedApps: Array.from(new Set(appIds.filter((appId) => appId.trim().length > 0))),
  }),
  
  startSync: () => set({ isSyncing: true, syncProgress: 0 }),
  
  setSyncProgress: (progress) => set({ syncProgress: progress }),
  
  completeOnboarding: () => set({ currentStep: 'complete', isSyncing: false, syncProgress: 100 }),
  
  resetOnboarding: () => set({
    currentStep: 'identity',
    institutionName: '',
    institutionPurpose: '',
    invitedEmails: [],
    connectedApps: [],
    isSyncing: false,
    syncProgress: 0,
  })
}));
