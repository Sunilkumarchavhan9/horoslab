# Epoch V12 Go Worker SDK

Provider-neutral Go client for the canonical Epoch V12 worker contract.

```go
client, err := epoch.NewClient(epoch.Config{
    BaseURL: "https://runtime.example.com",
    APIKey: os.Getenv("EPOCH_API_KEY"),
    WorkspaceID: "workspace-id",
    WorkerID: "worker-id",
})
if err != nil { log.Fatal(err) }

_, err = client.Register(ctx, epoch.WorkerRegistration{
    Kind: epoch.WorkerAIAgent,
    Name: "go-worker",
    Capabilities: []string{"coding", "structured_output"},
})
```

The client supports registration, heartbeat, lease, acknowledge, failure, evidence, and verification through `/api/v1/epoch/workspaces/:workspaceId/...`.
