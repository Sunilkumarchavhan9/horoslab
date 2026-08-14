export type LabScheduleType = "recurring" | "one_time";

export type LabScheduleEmailNotifications = "on_failure" | "all_runs" | "never";

export type LabScheduleRepoScope = "all" | "specific";

export type LabScheduleIntervalUnit = "hour" | "day" | "week";

export type LabScheduleFrequency = {
  timezone: string;
  hour: string;
  minute: string;
  interval: string;
  intervalUnit: LabScheduleIntervalUnit;
  repeatDays: string;
  rrule: string;
  cron: string;
};

export type LabSchedule = {
  id: string;
  name: string;
  type: LabScheduleType;
  frequency: LabScheduleFrequency;
  oneTimeAt?: string;
  prompt: string;
  playbookId: string | null;
  autoApproveChildSessions: boolean;
  repoScope: LabScheduleRepoScope;
  repos: string[];
  emailNotifications: LabScheduleEmailNotifications;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type LabScheduleDraft = Omit<LabSchedule, "id" | "createdBy" | "createdAt" | "updatedAt">;

export type LabSchedulesListScope = "mine" | "all";
