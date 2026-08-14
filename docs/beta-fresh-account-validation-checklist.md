# Beta Validation Checklist

Use this checklist to validate Epoch with a fresh account, a clean browser profile, and no developer intervention.

## Non-Negotiables

- Freeze features during validation.
- No new Mission Control pages.
- No new backend services.
- No UI redesigns.
- Do not use developer tools.
- Do not edit the database.
- Do not change `localStorage`.
- Do not run CLI commands to make the flow work.
- Do not change code during the test.
- Do not add new backend services during validation.

## Test Setup

- Fresh email address.
- Clean browser profile or incognito window.
- No existing organization selected.
- No seeded workspace state.
- Fresh teammate account for the second-user pass.

## Validation Flow

Complete the flow in order:

1. Sign up.
2. Verify email.
3. Sign in.
4. Create an organization.
5. Invite a teammate.
6. Refresh and confirm the organization persists.
7. Connect GitHub.
8. Connect Slack.
9. Refresh and confirm both connectors stay connected.
10. Run the initial sync.
11. Wait for sync completion.
12. Ask a Reality question.
13. Inspect the evidence-backed answer.
14. Open at least one original source record.
15. Create the first mission.
16. Review the mission plan.
17. Run the mission.
18. Refresh the page.
19. Confirm the mission still exists.
20. Confirm the beta completion screen appears.
21. Continue to Mission Control.

## Fresh User Runs

### Fresh User #1

- Use a completely new account.
- Do not fix anything during the test.
- Record onboarding time.
- Record every bug.
- Record every confusing screen.
- Record any API failures.
- Record any loading problems.

### Blocker Fixes

- Fix only issues that prevent the core workflow from completing.
- Leave non-blocking issues for after the first pass is complete.

### Fresh User #2

- Use another completely new account, or have someone else run the flow.
- Do not explain the product.
- Watch whether they can:
  - Sign up.
  - Connect GitHub.
  - Connect Slack.
  - Wait for indexing.
  - Ask Reality questions.
  - Create a mission.
  - Execute it.
  - Return later and see persisted data.

### Decision

- If both users complete the flow without assistance, start an external beta.
- If not, fix only the issues that blocked them and repeat the validation.

## Second User Pass

Repeat the flow with an invited teammate.

- Teammate accepts the invite.
- Teammate sees the same organization.
- Teammate can ask Reality a question.
- Teammate can run a mission.
- Teammate sees persisted state after refresh.

## Validation Report

Record one line per step:

| Step | Status | Notes |
| --- | --- | --- |
| Sign up |  |  |
| Verify email |  |  |
| Create organization |  |  |
| Invite teammate |  |  |
| Connect GitHub |  |  |
| Connect Slack |  |  |
| Initial sync |  |  |
| Ask Reality question |  |  |
| Review evidence |  |  |
| Create mission |  |  |
| Run mission |  |  |
| Return later |  |  |

Status values:

- `✅` Working end to end.
- `🟡` Working but confusing, slow, or fragile.
- `🔴` Broken or requires manual intervention.

## Success Criteria

- A new user reaches first value without help.
- Evidence-backed answers are available after the initial sync.
- Missions survive refresh.
- The completion screen appears at the end of onboarding.
- A teammate can join the same organization without manual setup.

## Record Friction

For every failure, hesitation, or workaround, capture:

- What step blocked the user.
- What the user expected to happen.
- What actually happened.
- Whether the problem is copy, UI, data, sync, auth, or persistence.
- The smallest fix that would remove the blockage.

## Exit

When two fresh users can complete the flow unaided, stop the audit and move the next engineering effort to the first friction point that showed up in the test.
