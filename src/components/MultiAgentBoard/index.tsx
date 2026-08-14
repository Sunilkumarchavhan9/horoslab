import React from 'react';

export default function MultiAgentBoard() {
  return (
    <div style={{ padding: 12 }}>
      <h3>Multi-Agent Task Board</h3>
      <p>Timeline: Manager → Coder → Reviewer → Verifier</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
        <div style={{ padding: 8, border: '1px solid var(--border)' }}>
          <strong>Manager</strong>
          <div>Status: idle</div>
        </div>

        <div style={{ padding: 8, border: '1px solid var(--border)' }}>
          <strong>Coder</strong>
          <div>Status: idle</div>
        </div>

        <div style={{ padding: 8, border: '1px solid var(--border)' }}>
          <strong>Reviewer</strong>
          <div>Status: idle</div>
        </div>

        <div style={{ padding: 8, border: '1px solid var(--border)' }}>
          <strong>Verifier</strong>
          <div>Status: idle</div>
        </div>
      </div>
    </div>
  );
}
