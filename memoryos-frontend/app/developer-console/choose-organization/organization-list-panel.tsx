"use client";

import { OrganizationList } from "@clerk/nextjs";

export function OrganizationListPanel() {
  return (
    <OrganizationList
      afterSelectOrganizationUrl="/developer-console"
      afterCreateOrganizationUrl="/developer-console"
    />
  );
}
