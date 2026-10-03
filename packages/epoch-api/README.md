# `@epochtm/api`

Epoch API client for institution runtime services.

```bash
npm i @epochtm/api
```

```ts
import { createEpochApiClient } from "@epochtm/api";

const api = createEpochApiClient({
  baseUrl: "https://api.memoryostm.dev",
  apiKey: process.env.EPOCH_API_KEY,
});

const status = await api.getAgentAccessStatus();
```
