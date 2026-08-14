"use client";

import { useId } from "react";
import { HdBrandIcon, type HdBrandIconProps } from "@/components/continuity-lab/brand-icons/hd-brand-icon";

type IconProps = { className?: string };

/** Microsoft Teams — Fluent mark: gradient people + blue T tile. */
export function MicrosoftTeamsHdIcon({ className }: IconProps) {
  const uid = useId().replace(/:/g, "");
  const gradId = `teams-people-${uid}`;

  return (
    <HdBrandIcon className={className}>
      <defs>
        <linearGradient id={gradId} x1="14" y1="3" x2="14" y2="14" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B8CC7" />
          <stop offset="0.5" stopColor="#6E6FB5" />
          <stop offset="1" stopColor="#5B5FC7" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradId})`}
        d="M17.25 5.25a2.25 2.25 0 1 0-4.5 0 2.25 2.25 0 0 0 4.5 0ZM14.5 8.75a3.25 3.25 0 0 0-3.25 3.25V14h6.5v-1.5a3.25 3.25 0 0 0-3.25-3.25Z"
      />
      <path
        fill={`url(#${gradId})`}
        d="M8.75 6a2.75 2.75 0 1 0-5.5 0 2.75 2.75 0 0 0 5.5 0ZM6 10.25a4 4 0 0 0-4 4V16h8v-1.75a4 4 0 0 0-4-4Z"
      />
      <rect fill="#5059C9" x="2" y="11" width="10" height="10" rx="1.75" />
      <path
        fill="#fff"
        d="M5.1 14.35h1.75v4.5H5.1zm3.15 0H10v4.5H8.25z"
      />
    </HdBrandIcon>
  );
}

/** GitLab tanuki — three orange tones + white highlights. */
export function GitLabHdIcon({ className }: IconProps) {
  return (
    <HdBrandIcon className={className}>
      <path
        fill="#E24329"
        d="M23.6 9.59l-3.16-9.7a.85.85 0 0 0-.32-.4.87.87 0 0 0-1 .05.87.87 0 0 0-.29.44L16.55 6.75H7.54L5.27.98a.86.86 0 0 0-.29-.44.87.87 0 0 0-1-.05.85.85 0 0 0-.32.4L.43 9.59a.61.61 0 0 0 .02.57l11.14 10.82.01.01 3.73 3.67 3.73-3.67.01-.01 11.14-10.82a.61.61 0 0 0 .02-.57Z"
      />
      <path fill="#FC6D26" d="M12 17.9 7.54 6.75h8.92L12 17.9Z" />
      <path fill="#FCA326" d="M12 17.9 16.46 6.75H7.54L12 17.9Z" />
      <path
        fill="#fff"
        d="M12 17.9 9.27 11.1h5.46L12 17.9Z"
        opacity={0.95}
      />
    </HdBrandIcon>
  );
}

/** Bitbucket — blue bucket with white accent bar. */
export function BitbucketHdIcon({ className }: IconProps) {
  return (
    <HdBrandIcon className={className}>
      <path
        fill="#2684FF"
        d="M.78 1.21a.77.77 0 0 0-.77.89l3.26 19.81c.08.5.52.87 1.02.87h16.87a.77.77 0 0 0 .77-.65l3.27-20.03a.77.77 0 0 0-.77-.89H.78Z"
      />
      <path fill="#fff" d="M14.52 15.53H9.52L8.17 8.47h7.56L14.52 15.53Z" />
    </HdBrandIcon>
  );
}

/** Linear — four purple diagonal stripes. */
export function LinearHdIcon({ className }: IconProps) {
  return (
    <HdBrandIcon className={className}>
      <path fill="#5E6AD2" d="M2.89 4.18A12 12 0 0 1 12 0c6.62 0 12 5.38 12 12.01 0 3.64-1.62 6.9-4.18 9.1L2.89 4.18Z" />
      <path fill="#6E79E0" d="M1.82 5.63 18.38 22.2c-.52.33-1.08.62-1.65.87L.95 7.28c.25-.58.54-1.13.87-1.65Z" />
      <path fill="#7F89E8" d="M.32 9.16 14.84 23.7a12 12 0 0 1-2.2.32L0 11.36a12 12 0 0 1 .32-2.2Z" />
      <path fill="#9BA3F0" d="M.15 14.02 9.97 23.8a12 12 0 0 1-9.82-9.78Z" />
    </HdBrandIcon>
  );
}

/** Notion — dark tile + white N mark (reads on dark UI). */
export function NotionHdIcon({ className }: IconProps) {
  return (
    <HdBrandIcon className={className}>
      <path
        fill="#fff"
        d="M4.46 4.21c.75.6 1.03.56 2.43.47l13.22-.79c.28 0 .05-.28-.05-.33L17.86 1.97c-.42-.33-.98-.7-2.06-.61L3.01 2.3c-.47.05-.56.28-.37.47zm.79 3.08v13.9c0 .75.37 1.03 1.21.98l14.52-.84c.84-.05.94-.56.94-1.17V6.35c0-.61-.23-.93-.75-.89l-15.18.89c-.56.05-.75.33-.75.93zm14.34.75c.09.42 0 .84-.42.89l-.7.14v10.26c-.61.33-1.17.51-1.64.51-.75 0-.94-.23-1.5-.93l-4.58-7.19v6.95L12.21 19s0 .84-1.17.84l-3.22.19c-.09-.19 0-.65.33-.75l.84-.23V9.85L7.82 9.76c-.09-.42.14-1.03.79-1.07l3.46-.23 4.76 7.28v-6.44l-1.22-.14c-.09-.51.28-.89.75-.93zM1.94 1.04l13.31-.98c1.63-.14 2.06-.05 3.08.7l4.25 2.99c.7.51.93.65.93 1.21v16.38c0 1.03-.37 1.63-1.68 1.73l-15.46.93c-.98.05-1.45-.09-1.96-.75l-3.13-4.06c-.56-.75-.79-1.31-.79-1.96V2.67c0-.84.37-1.54 1.45-1.63z"
      />
    </HdBrandIcon>
  );
}

/** Atlassian — blue gradient swoosh (Jira family). */
export function AtlassianHdIcon({ className }: IconProps) {
  const uid = useId().replace(/:/g, "");
  const gradA = `atlassian-a-${uid}`;
  const gradB = `atlassian-b-${uid}`;

  return (
    <HdBrandIcon className={className}>
      <defs>
        <linearGradient id={gradA} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0052CC" />
          <stop offset="100%" stopColor="#2684FF" />
        </linearGradient>
        <linearGradient id={gradB} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0065FF" />
          <stop offset="100%" stopColor="#4C9AFF" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradA})`}
        d="M7.12 11.08a.68.68 0 0 0-1.16.13L.08 22.97a.7.7 0 0 0 .63 1.02h8.19a.68.68 0 0 0 .63-.39c1.77-3.65.7-9.2-2.41-12.52Z"
      />
      <path
        fill={`url(#${gradB})`}
        d="M11.43.39a15.5 15.5 0 0 0-.91 15.32l3.95 7.9a.7.7 0 0 0 .63.39h8.19a.7.7 0 0 0 .63-1.02L12.63.38a.66.66 0 0 0-1.2.01Z"
      />
    </HdBrandIcon>
  );
}
