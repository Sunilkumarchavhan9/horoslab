import React from 'react';

export default function LeftNav() {
  return (
    <aside style={{ height: '100%', padding: 12 }}>
      <div style={{ marginBottom: 12 }}>
        <strong>Chat</strong>
        {/* TODO: Wire ChatPanel here (preserve existing data bindings) */}
      </div>

      <div>
        <strong>Sessions</strong>
        {/* TODO: Wire SessionList here */}
      </div>
    </aside>
  );
}
