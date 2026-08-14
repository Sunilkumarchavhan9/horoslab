use reqwest::{Client as HttpClient, Method};
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum Error { #[error("invalid client configuration: {0}")] Config(String), #[error("HTTP request failed: {0}")] Http(#[from] reqwest::Error), #[error("API error {status}: {message}")] Api { status: u16, message: String } }

#[derive(Clone, Serialize)]
pub struct Config { pub base_url: String, pub api_key: String, pub workspace_id: String, pub worker_id: String }
#[derive(Clone, Serialize)] pub struct WorkerRegistration { pub kind: String, pub name: String, #[serde(skip_serializing_if = "Option::is_none")] pub protocol_version: Option<String>, #[serde(skip_serializing_if = "Option::is_none")] pub capabilities: Option<Vec<String>> }
#[derive(Debug, Deserialize)] pub struct Worker { pub id: String, pub status: String }
#[derive(Debug, Deserialize)] pub struct Job { pub id: String }
#[derive(Debug, Deserialize)] pub struct Lease { pub jobs: Vec<Job>, #[serde(rename = "fencingTokens")] pub fencing_tokens: std::collections::HashMap<String, i64> }
#[derive(Clone, Serialize)] pub struct EvidenceItem { pub kind: String, #[serde(skip_serializing_if = "Option::is_none")] pub summary: Option<String>, #[serde(skip_serializing_if = "Option::is_none")] pub url: Option<String>, #[serde(rename = "filePath", skip_serializing_if = "Option::is_none")] pub file_path: Option<String>, #[serde(rename = "contentType", skip_serializing_if = "Option::is_none")] pub content_type: Option<String>, #[serde(skip_serializing_if = "Option::is_none")] pub payload: Option<serde_json::Value> }
#[derive(Clone, Default, Serialize)] pub struct VerificationInput { #[serde(skip_serializing_if = "Option::is_none")] pub checklist: Option<Vec<String>>, #[serde(rename = "evidenceIds", skip_serializing_if = "Option::is_none")] pub evidence_ids: Option<Vec<String>>, #[serde(rename = "humanApproval", skip_serializing_if = "Option::is_none")] pub human_approval: Option<String>, #[serde(skip_serializing_if = "Option::is_none")] pub confidence: Option<f64> }

pub struct EpochWorker { config: Config, http: HttpClient }
impl EpochWorker {
    pub fn new(config: Config) -> Result<Self, Error> { if config.base_url.is_empty() || config.api_key.is_empty() || config.workspace_id.is_empty() || config.worker_id.is_empty() { return Err(Error::Config("base_url, api_key, workspace_id, and worker_id are required".into())); } Ok(Self { config, http: HttpClient::new() }) }
    fn path(&self, parts: &[&str]) -> String { format!("{}/api/v1/epoch/workspaces/{}/{}", self.config.base_url.trim_end_matches('/'), self.config.workspace_id, parts.join("/")) }
    async fn request<T: DeserializeOwned, B: Serialize>(&self, method: Method, parts: &[&str], body: Option<&B>) -> Result<T, Error> { let mut req = self.http.request(method, self.path(parts)).bearer_auth(&self.config.api_key); if let Some(body) = body { req = req.json(body); } let response = req.send().await?; let status = response.status(); let envelope: serde_json::Value = response.json().await?; if !status.is_success() { return Err(Error::Api { status: status.as_u16(), message: envelope["error"]["message"].as_str().unwrap_or("request failed").into() }); } Ok(serde_json::from_value(envelope.get("data").cloned().unwrap_or(envelope)).unwrap()) }
    pub async fn register(&self, input: WorkerRegistration) -> Result<Worker, Error> { #[derive(Deserialize)] struct Out { worker: Worker } let out: Out = self.request(Method::POST, &["workers"], Some(&input)).await?; Ok(out.worker) }
    pub async fn heartbeat(&self, status: &str) -> Result<serde_json::Value, Error> { self.request(Method::POST, &["workers", &self.config.worker_id, "heartbeat"], Some(&serde_json::json!({"status": status}))).await }
    pub async fn lease(&self, limit: i64, lease_ms: i64) -> Result<Lease, Error> { self.request(Method::POST, &["queue", "lease"], Some(&serde_json::json!({"workerId": self.config.worker_id, "limit": limit, "leaseMs": lease_ms}))).await }
    pub async fn complete(&self, job_id: &str, fencing_token: i64) -> Result<serde_json::Value, Error> { self.request(Method::POST, &["queue", job_id, "ack"], Some(&serde_json::json!({"workerId": self.config.worker_id, "fencingToken": fencing_token}))).await }
    pub async fn fail(&self, job_id: &str, error: &str) -> Result<serde_json::Value, Error> { self.request(Method::POST, &["queue", job_id, "fail"], Some(&serde_json::json!({"error": error}))).await }
    pub async fn record_evidence(&self, mission_id: &str, evidence: Vec<EvidenceItem>) -> Result<serde_json::Value, Error> { self.request(Method::POST, &["missions", mission_id, "evidence"], Some(&serde_json::json!({"evidence": evidence}))).await }
    pub async fn verify(&self, mission_id: &str, input: VerificationInput) -> Result<serde_json::Value, Error> { self.request(Method::POST, &["missions", mission_id, "verify"], Some(&input)).await }
}
