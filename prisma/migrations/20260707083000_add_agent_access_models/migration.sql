CREATE TABLE IF NOT EXISTS "agent_access_keys" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key_prefix" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'agent-access',
    "status" TEXT NOT NULL DEFAULT 'active',
    "content_tag" TEXT NOT NULL DEFAULT 'agent_memory_protocol',
    "endpoints" JSONB NOT NULL DEFAULT '[]',
    "usage" JSONB NOT NULL DEFAULT '{}',
    "expires_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_access_keys_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "agent_tokens" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "key_id" TEXT,
    "name" TEXT NOT NULL,
    "token_prefix" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "scopes" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'active',
    "last_used_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_tokens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "mcp_connections" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "client" TEXT NOT NULL DEFAULT 'mcp',
    "status" TEXT NOT NULL DEFAULT 'connected',
    "config" JSONB NOT NULL DEFAULT '{}',
    "last_test_at" TIMESTAMP(3),
    "proof" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mcp_connections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "connected_agents" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'agent',
    "status" TEXT NOT NULL DEFAULT 'offline',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "last_seen_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connected_agents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "agent_access_events" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "key_id" TEXT,
    "agent" TEXT,
    "type" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'GET',
    "route" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Success',
    "status_code" INTEGER,
    "latency_ms" INTEGER,
    "request_id" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_access_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "webhook_endpoints" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" JSONB NOT NULL DEFAULT '[]',
    "secret_hash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "last_test_at" TIMESTAMP(3),
    "proof" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_endpoints_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "protocol_gate_runs" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "ready" BOOLEAN NOT NULL DEFAULT false,
    "passed" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "checks" JSONB NOT NULL DEFAULT '[]',
    "proof" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "protocol_gate_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "runtime_proofs" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'runtime_proof.v1',
    "status" TEXT NOT NULL DEFAULT 'ready',
    "ready" BOOLEAN NOT NULL DEFAULT false,
    "proof" JSONB NOT NULL DEFAULT '{}',
    "total_events" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "runtime_proofs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "agent_access_keys_key_hash_key" ON "agent_access_keys"("key_hash");
CREATE UNIQUE INDEX IF NOT EXISTS "agent_tokens_token_hash_key" ON "agent_tokens"("token_hash");
CREATE INDEX IF NOT EXISTS "idx_agent_access_keys_workspace_status_created" ON "agent_access_keys"("workspace_id", "status", "created_at");
CREATE INDEX IF NOT EXISTS "idx_agent_tokens_workspace_status_created" ON "agent_tokens"("workspace_id", "status", "created_at");
CREATE INDEX IF NOT EXISTS "idx_agent_tokens_key" ON "agent_tokens"("key_id");
CREATE INDEX IF NOT EXISTS "idx_mcp_connections_workspace_status_updated" ON "mcp_connections"("workspace_id", "status", "updated_at");
CREATE INDEX IF NOT EXISTS "idx_connected_agents_workspace_status_updated" ON "connected_agents"("workspace_id", "status", "updated_at");
CREATE INDEX IF NOT EXISTS "idx_connected_agents_workspace_agent" ON "connected_agents"("workspace_id", "agent_id");
CREATE INDEX IF NOT EXISTS "idx_agent_access_events_workspace_created" ON "agent_access_events"("workspace_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_agent_access_events_key_created" ON "agent_access_events"("key_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_webhook_endpoints_workspace_status_created" ON "webhook_endpoints"("workspace_id", "status", "created_at");
CREATE INDEX IF NOT EXISTS "idx_protocol_gate_runs_workspace_created" ON "protocol_gate_runs"("workspace_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_runtime_proofs_workspace_updated" ON "runtime_proofs"("workspace_id", "updated_at");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_access_keys_workspace_id_fkey') THEN
        ALTER TABLE "agent_access_keys" ADD CONSTRAINT "agent_access_keys_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_tokens_workspace_id_fkey') THEN
        ALTER TABLE "agent_tokens" ADD CONSTRAINT "agent_tokens_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_tokens_key_id_fkey') THEN
        ALTER TABLE "agent_tokens" ADD CONSTRAINT "agent_tokens_key_id_fkey" FOREIGN KEY ("key_id") REFERENCES "agent_access_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mcp_connections_workspace_id_fkey') THEN
        ALTER TABLE "mcp_connections" ADD CONSTRAINT "mcp_connections_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'connected_agents_workspace_id_fkey') THEN
        ALTER TABLE "connected_agents" ADD CONSTRAINT "connected_agents_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_access_events_workspace_id_fkey') THEN
        ALTER TABLE "agent_access_events" ADD CONSTRAINT "agent_access_events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_access_events_key_id_fkey') THEN
        ALTER TABLE "agent_access_events" ADD CONSTRAINT "agent_access_events_key_id_fkey" FOREIGN KEY ("key_id") REFERENCES "agent_access_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'webhook_endpoints_workspace_id_fkey') THEN
        ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'protocol_gate_runs_workspace_id_fkey') THEN
        ALTER TABLE "protocol_gate_runs" ADD CONSTRAINT "protocol_gate_runs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'runtime_proofs_workspace_id_fkey') THEN
        ALTER TABLE "runtime_proofs" ADD CONSTRAINT "runtime_proofs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
