import React from 'react';
import LeftNav from './LeftNav';
import CenterWorkspace from './CenterWorkspace';
import RightRail from './RightRail';

export interface MythicShellProps {
  // Panels should be provided as children or via wiring to existing app state
  children?: React.ReactNode;
}

export default function MythicShell({ children }: MythicShellProps) {
  return (
    <div className="mythic-shell" style={{ display: 'flex', width: '100%', height: '100vh' }}>
      <div style={{ flex: '0 0 280px', borderRight: '1px solid var(--border)' }}>
        <LeftNav />
      </div>

      <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
        <CenterWorkspace>{children}</CenterWorkspace>
      </div>

      <div style={{ flex: '0 0 340px', borderLeft: '1px solid var(--border)' }}>
        <RightRail />
      </div>
    </div>
  );
}
