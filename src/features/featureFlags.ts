// Lightweight feature flag helper.
// This file provides a minimal API to toggle UI features during rollout.

export type FeatureKey = 'mythic_ui' | 'mythic_shell_rollout';

const DEFAULTS: Record<FeatureKey, boolean> = {
  mythic_ui: false,
  mythic_shell_rollout: false,
};

export class FeatureFlags {
  private overrides: Partial<Record<FeatureKey, boolean>> = {};

  constructor(initial?: Partial<Record<FeatureKey, boolean>>) {
    this.overrides = initial || {};
  }

  isEnabled(key: FeatureKey): boolean {
    // 1) explicit override
    if (this.overrides[key] !== undefined) return !!this.overrides[key];

    // 2) environment variable (NODE env in server; window.__FEATURE_FLAGS__ in browser)
    try {
      if (typeof process !== 'undefined' && process.env) {
        const name = `FEATURE_${key.toUpperCase()}`;
        if (process.env[name] !== undefined) return process.env[name] === 'true';
      }

      // browser global (for quick toggles during dev)
      // @ts-ignore
      if (typeof window !== 'undefined' && (window.__FEATURE_FLAGS__ || {})[key] !== undefined) {
        // @ts-ignore
        return !!window.__FEATURE_FLAGS__[key];
      }
    } catch (e) {
      // noop
    }

    // fallback to defaults
    return DEFAULTS[key];
  }

  setOverride(key: FeatureKey, value: boolean) {
    this.overrides[key] = value;
  }

  clearOverride(key: FeatureKey) {
    delete this.overrides[key];
  }
}

export const featureFlags = new FeatureFlags();
