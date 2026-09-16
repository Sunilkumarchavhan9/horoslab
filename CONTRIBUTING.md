# Contributing to MemoryOS

Thanks for helping improve MemoryOS. This guide keeps contributions consistent and easy to review.

## Development Setup

1. Fork the repository and clone your fork.
2. Install dependencies:

```bash
npm install
cd memoryos-frontend && npm install
cd ..
```

3. Create local environment file:

```bash
cp .env.example .env
```

4. Start development:

```bash
npm run dev:full
```

## Branch Naming

Use clear branch names:

- `feat/<short-description>`
- `fix/<short-description>`
- `docs/<short-description>`
- `chore/<short-description>`

## Commit Style

Use concise, descriptive commits:

- `feat: add retrieval confidence debug field`
- `fix: handle missing connector callback secret`
- `docs: update local setup guide`

## Pull Request Checklist

Before opening a PR, make sure:

- `npm run lint` passes
- `npm run test` passes
- docs are updated when behavior changes
- screenshots are included for UI changes
- PR description explains motivation, change, and validation

## Code Standards

- Prefer TypeScript strictness and explicit types on public interfaces.
- Keep modules focused and avoid broad refactors in feature PRs.
- Add tests for bug fixes and behavior changes.
- Avoid committing secrets or credentials.

## Reporting Issues

When opening issues, include:

- expected behavior
- actual behavior
- repro steps
- environment details
- logs/screenshots where helpful
