import React from 'react';

export default function CenterWorkspace({ children }: { children?: React.ReactNode }) {
  return (
    <main style={{ height: '100%', padding: 8, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: '0 0 44px', borderBottom: '1px solid var(--border)', padding: 8 }}>
        {/* Tab group: Chat / Worklog / Changes / PR */}
        <nav>
          <button>Chat</button>
          <button>Worklog</button>
          <button>Changes</button>
          <button>PR</button>
        </nav>
      </div>

      <div style={{ flex: '1 1 auto', overflow: 'auto', padding: 12 }}>{children || <div>Center panel placeholder</div>}</div>
    </main>
  );
}
