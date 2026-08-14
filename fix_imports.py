import sys

file_path = "memoryos-frontend/components/mission-control/mission-control-workspace.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# We know that the file currently has:
# import { useClerk } from "@clerk/nextjs"
# import { InstitutionDetailLayout } from './institution-detail-layout';

# And it SHOULD have the lucide-react imports and the other components before InstitutionDetailLayout.

imports_to_insert = """import {
  CheckCircle2,
  Loader2,
  Home,
  ArrowRight,
  Check,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Search,
  MoreHorizontal,
  RefreshCw,
  Plus,
  Settings,
  Rocket,
  PanelLeftClose,
  User,
  Database,
  Shield,
  Building,
  Play,
  ShieldCheck,
  Scale,
  Brain,
  Blocks,
  Terminal,
  Pin,
  LayoutDashboard,
  FileText,
  Clock,
  History,
} from "lucide-react"

import { DateRangePicker } from "./date-range-picker"
import { CommandPalette } from "./command-palette"
import { AccountHomeDashboard, DashboardSkeletonLoader } from "./account-home-dashboard"
import { InstitutionsOverview } from './institutions-overview';
import { InstitutionsTemplates } from './institutions-templates';
import { InstitutionsArchive } from './institutions-archive';
import { GovernanceAuthority } from './governance-authority';
import { GovernanceAuthorityDetail } from './governance-authority-detail';
import { GovernancePolicies } from './governance-policies';
import { GovernancePolicyDetail } from './governance-policy-detail';
"""

target = 'import { useClerk } from "@clerk/nextjs"\nimport { InstitutionDetailLayout } from \'./institution-detail-layout\';'
replacement = 'import { useClerk } from "@clerk/nextjs"\n' + imports_to_insert + "import { InstitutionDetailLayout } from './institution-detail-layout';"

new_content = content.replace(target, replacement)

# Let's also add AccountRecents and SECTION_INFO if not present
if "import { AccountRecents" not in new_content:
    target2 = "import { AccountMembers } from './account-members';"
    replacement2 = "import { AccountMembers } from './account-members';\nimport { AccountRecents, type RecentItem } from './account-recents';\n\nconst SECTION_INFO: Record<string, { title: string, sub: string }> = {\n  \"home\": { title: \"Account home\", sub: \"\" },\n  \"institutions-overview\": { title: \"Overview\", sub: \"All Institutions\" },\n  \"institutions-templates\": { title: \"Templates\", sub: \"Setup\" },\n  \"missions-active\": { title: \"Active\", sub: \"Current Operations\" },\n  \"missions-history\": { title: \"History\", sub: \"Past Logs\" },\n  \"authority\": { title: \"Authority\", sub: \"Access\" },\n  \"policies\": { title: \"Policies\", sub: \"Rules\" },\n  \"memory-records\": { title: \"Institution Records\", sub: \"Storage\" },\n  \"memory-lessons\": { title: \"Lessons Learned\", sub: \"AI\" },\n  \"integrations-connections\": { title: \"Connections\", sub: \"Systems\" },\n  \"integrations-data-sources\": { title: \"Data Sources\", sub: \"Evidence\" },\n  \"developer-mcp\": { title: \"MCP\", sub: \"Protocol\" },\n  \"developer-sdk\": { title: \"SDK\", sub: \"Libraries\" },\n  \"developer-webhooks\": { title: \"Webhooks\", sub: \"Delivery\" },\n  \"account-members\": { title: \"Members\", sub: \"Manage account\" },\n  \"recents\": { title: \"Recents\", sub: \"Manage account\" },\n};\n"
    new_content = new_content.replace(target2, replacement2)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Fixed imports successfully!")
