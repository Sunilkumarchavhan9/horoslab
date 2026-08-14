// Package epoch provides a small, provider-neutral client for Epoch V12 workers.
package epoch

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
)

type WorkerKind string

const (
	WorkerSoftware      WorkerKind = "software"
	WorkerAIAgent       WorkerKind = "ai_agent"
	WorkerSimulatedEdge WorkerKind = "simulated_edge"
	WorkerHuman         WorkerKind = "human"
)

type Config struct {
	BaseURL    string
	APIKey     string
	WorkspaceID string
	WorkerID   string
	HTTPClient *http.Client
}

type WorkerRegistration struct {
	Kind           WorkerKind       `json:"kind"`
	Name           string           `json:"name"`
	ProtocolVersion string          `json:"protocolVersion,omitempty"`
	Capabilities   []string         `json:"capabilities,omitempty"`
	ProjectScope   map[string]any   `json:"projectScope,omitempty"`
	MaxConcurrency int              `json:"maxConcurrency,omitempty"`
}

type Job struct { ID string `json:"id"` }
type Lease struct {
	Jobs          []Job          `json:"jobs"`
	FencingTokens map[string]int `json:"fencingTokens"`
}

type EvidenceItem struct {
	Kind        string         `json:"kind"`
	URL         string         `json:"url,omitempty"`
	FilePath    string         `json:"filePath,omitempty"`
	ContentType string         `json:"contentType,omitempty"`
	Summary     string         `json:"summary,omitempty"`
	Payload     map[string]any `json:"payload,omitempty"`
	Proof       map[string]any `json:"proof,omitempty"`
}

type VerificationInput struct {
	Checklist     []string       `json:"checklist,omitempty"`
	EvidenceIDs   []string       `json:"evidenceIds,omitempty"`
	HumanApproval string         `json:"humanApproval,omitempty"`
	Confidence    float64        `json:"confidence,omitempty"`
	Output        map[string]any `json:"output,omitempty"`
	Approvals     []string       `json:"approvals,omitempty"`
}

type Worker struct { ID string `json:"id"`; Status string `json:"status"` }

type Client struct {
	baseURL, apiKey, workspaceID, workerID string
	httpClient *http.Client
}

func NewClient(config Config) (*Client, error) {
	if strings.TrimSpace(config.BaseURL) == "" || strings.TrimSpace(config.APIKey) == "" || strings.TrimSpace(config.WorkspaceID) == "" || strings.TrimSpace(config.WorkerID) == "" {
		return nil, fmt.Errorf("base URL, API key, workspace ID, and worker ID are required")
	}
	return &Client{strings.TrimRight(config.BaseURL, "/"), config.APIKey, config.WorkspaceID, config.WorkerID, chooseHTTPClient(config.HTTPClient)}, nil
}

func chooseHTTPClient(client *http.Client) *http.Client { if client != nil { return client }; return http.DefaultClient }
func (c *Client) path(parts ...string) string { escaped := make([]string, len(parts)); for i, part := range parts { escaped[i] = url.PathEscape(part) }; return "/api/v1/epoch/workspaces/" + url.PathEscape(c.workspaceID) + "/" + strings.Join(escaped, "/") }

func (c *Client) request(ctx context.Context, method, path string, input any, output any) error {
	var body *bytes.Reader
	if input == nil { body = bytes.NewReader(nil) } else { encoded, err := json.Marshal(input); if err != nil { return err }; body = bytes.NewReader(encoded) }
	req, err := http.NewRequestWithContext(ctx, method, c.baseURL+path, body); if err != nil { return err }
	req.Header.Set("Authorization", "Bearer "+c.apiKey); req.Header.Set("Content-Type", "application/json")
	resp, err := c.httpClient.Do(req); if err != nil { return err }; defer resp.Body.Close()
	var envelope struct { Data json.RawMessage `json:"data"`; Error struct { Message string `json:"message"` } `json:"error"` }
	if err := json.NewDecoder(resp.Body).Decode(&envelope); err != nil { return err }
	if resp.StatusCode < 200 || resp.StatusCode >= 300 { return fmt.Errorf("epoch v12 worker API error %d: %s", resp.StatusCode, envelope.Error.Message) }
	if output == nil { return nil }; raw := envelope.Data; if len(raw) == 0 || string(raw) == "null" { return nil }; return json.Unmarshal(raw, output)
}

func (c *Client) Register(ctx context.Context, input WorkerRegistration) (*Worker, error) { var out struct { Worker Worker `json:"worker"` }; err := c.request(ctx, http.MethodPost, c.path("workers"), input, &out); return &out.Worker, err }
func (c *Client) Heartbeat(ctx context.Context, status string) error { return c.request(ctx, http.MethodPost, c.path("workers", c.workerID, "heartbeat"), map[string]string{"status": status}, nil) }
func (c *Client) Lease(ctx context.Context, limit, leaseMS int) (*Lease, error) { var out Lease; err := c.request(ctx, http.MethodPost, c.path("queue", "lease"), map[string]any{"workerId": c.workerID, "limit": limit, "leaseMs": leaseMS}, &out); return &out, err }
func (c *Client) Complete(ctx context.Context, jobID string, fencingToken int) error { return c.request(ctx, http.MethodPost, c.path("queue", jobID, "ack"), map[string]any{"workerId": c.workerID, "fencingToken": fencingToken}, nil) }
func (c *Client) Fail(ctx context.Context, jobID, failure string) error { return c.request(ctx, http.MethodPost, c.path("queue", jobID, "fail"), map[string]string{"error": failure}, nil) }
func (c *Client) RecordEvidence(ctx context.Context, missionID string, evidence []EvidenceItem) error { return c.request(ctx, http.MethodPost, c.path("missions", missionID, "evidence"), map[string]any{"evidence": evidence}, nil) }
func (c *Client) Verify(ctx context.Context, missionID string, input VerificationInput) error { return c.request(ctx, http.MethodPost, c.path("missions", missionID, "verify"), input, nil) }
