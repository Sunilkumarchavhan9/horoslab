import os

perspectives = {
    'overview': ('MissionOverview.tsx', 'MissionOverview', 'Overview'),
    'planner': ('MissionPlannerView.tsx', 'MissionPlannerView', 'Planner'),
    'active': ('MissionActiveView.tsx', 'MissionActiveView', 'Active Missions'),
    'templates': ('MissionTemplatesView.tsx', 'MissionTemplatesView', 'Mission Templates'),
    'queue': ('MissionQueueView.tsx', 'MissionQueueView', 'Queue'),
    'automation': ('MissionAutomationView.tsx', 'MissionAutomationView', 'Automation'),
    'timeline': ('MissionTimelineView.tsx', 'MissionTimelineView', 'Timeline'),
    'history': ('MissionHistoryView.tsx', 'MissionHistoryView', 'Mission History'),
    'execution': ('MissionExecutionView.tsx', 'MissionExecutionView', 'Execution')
}

base_dir = r'c:\projects\MemoryOS\memoryos-frontend\runtime\missions\perspectives'

for folder, (filename, component, title) in perspectives.items():
    path = os.path.join(base_dir, folder, filename)
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if 'GlobalMissionRegistry.register' not in content:
            # Need to add import if missing
            if 'import { GlobalMissionRegistry }' not in content:
                content = content.replace('"use client";', '"use client";\n\nimport { GlobalMissionRegistry } from "../../runtime/MissionRegistry";')
                
            registration = f'''\n\nGlobalMissionRegistry.register({{
  id: "{folder}",
  title: "{title}",
  component: {component}
}});
'''
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content + registration)
            print(f'Registered {component} in {filename}')
