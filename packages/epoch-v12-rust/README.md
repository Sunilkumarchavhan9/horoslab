# Epoch V12 Rust Worker SDK

Async, provider-neutral Rust client for the Epoch V12 worker contract.

```rust
let worker = epoch_v12_worker::EpochWorker::new(epoch_v12_worker::Config {
    base_url: std::env::var("EPOCH_BASE_URL")?,
    api_key: std::env::var("EPOCH_API_KEY")?,
    workspace_id: "workspace-id".into(),
    worker_id: "worker-id".into(),
})?;
let lease = worker.lease(1, 30_000).await?;
```

The client supports registration, heartbeat, lease, acknowledge, failure, evidence, and verification through the canonical V12 API.
