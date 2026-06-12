import React from 'react';

export default function RightRail() {
  return (
    <aside style={{ height: '100%', padding: 12 }}>
      <div style={{ marginBottom: 12 }}>
        <strong>Shell</strong>
        {/* TODO: Wire ShellPanel (terminal + history) */}
      </div>

      <div style={{ marginBottom: 12 }}>
        <strong>Desktop</strong>
        {/* TODO: Wire DesktopPanel (VNC/streaming viewer) */}
      </div>

      <div>
        <strong>Status</strong>
        {/* TODO: Status badges (agent states) */}
      </div>
    </aside>
  );
}
