const fs = require('fs');
const path = require('path');

const mockDataMap = {
    'ProvidersView.tsx': {
        constName: 'MOCK_PROVIDERS',
        data: `[
    { id: "prov-1", provider: "OpenAI", status: "Active", regions: "US East, EU West", auth: "API Key", apiVersion: "v1", updated: new Date().toLocaleString() },
    { id: "prov-2", provider: "Anthropic", status: "Active", regions: "US East", auth: "API Key", apiVersion: "v1", updated: new Date().toLocaleString() },
    { id: "prov-3", provider: "Google Vertex", status: "Degraded", regions: "Global", auth: "OAuth", apiVersion: "v1", updated: new Date().toLocaleString() },
    { id: "prov-4", provider: "Azure OpenAI", status: "Active", regions: "EU North", auth: "API Key", apiVersion: "2024-02-15-preview", updated: new Date().toLocaleString() }
]`,
        fetchTarget: 'const res = await fetch("/api/epoch/ai-execution/providers");',
        fetchReplacement: 'await new Promise(r => setTimeout(r, 600));\n            setProviders(MOCK_PROVIDERS);\n            /* ',
        closeReplacement: '*/'
    },
    'ModelsView.tsx': {
        constName: 'MOCK_MODELS',
        data: `[
    { id: "mod-1", name: "GPT-4o", provider: "OpenAI", contextWindow: "128k", modalities: ["Text", "Vision"], toolCalling: true, structuredOutput: true, reasoning: false, version: "2024-05-13", status: "Active" },
    { id: "mod-2", name: "Claude 3.5 Sonnet", provider: "Anthropic", contextWindow: "200k", modalities: ["Text", "Vision"], toolCalling: true, structuredOutput: true, reasoning: false, version: "20240620", status: "Active" },
    { id: "mod-3", name: "O1-preview", provider: "OpenAI", contextWindow: "128k", modalities: ["Text"], toolCalling: false, structuredOutput: false, reasoning: true, version: "2024-09", status: "Beta" }
]`,
        fetchTarget: 'const res = await fetch("/api/epoch/ai-execution/models");',
        fetchReplacement: 'await new Promise(r => setTimeout(r, 600));\n            setModels(MOCK_MODELS);\n            /* ',
        closeReplacement: '*/'
    },
    'WorkersView.tsx': {
        constName: 'MOCK_WORKERS',
        data: `[
    { id: "wrk-1", worker: "DevWorker", status: "Idle", capabilities: ["Coding", "Bash"], activeMissions: "0", successRate: "98.5%", lastActive: new Date().toLocaleString() },
    { id: "wrk-2", worker: "ReviewAgent", status: "Executing", capabilities: ["Review", "Security"], activeMissions: "3", successRate: "99.1%", lastActive: new Date().toLocaleString() },
    { id: "wrk-3", worker: "DataScientist", status: "Offline", capabilities: ["Data", "Python"], activeMissions: "0", successRate: "95.2%", lastActive: new Date().toLocaleString() }
]`,
        fetchTarget: 'const res = await fetch("/api/epoch/ai-execution/workers");',
        fetchReplacement: 'await new Promise(r => setTimeout(r, 600));\n            setWorkers(MOCK_WORKERS);\n            /* ',
        closeReplacement: '*/'
    },
    'RoutingView.tsx': {
        constName: 'MOCK_ROUTING',
        data: `[
    { id: "rt-1", model: "GPT-4o", endpoint: "api.openai.com/v1", latency: "245ms", costPer1k: "$0.005", reliability: "99.9%", status: "Primary" },
    { id: "rt-2", model: "GPT-4o", endpoint: "azure-openai.microsoft.com", latency: "190ms", costPer1k: "$0.005", reliability: "99.99%", status: "Failover" },
    { id: "rt-3", model: "Claude 3.5 Sonnet", endpoint: "api.anthropic.com/v1", latency: "310ms", costPer1k: "$0.003", reliability: "99.8%", status: "Primary" }
]`,
        fetchTarget: 'const res = await fetch("/api/epoch/ai-execution/routing");',
        fetchReplacement: 'await new Promise(r => setTimeout(r, 600));\n            setRoutes(MOCK_ROUTING);\n            /* ',
        closeReplacement: '*/'
    },
    'GpuStatusView.tsx': {
        constName: 'MOCK_GPUS',
        data: `[
    { id: "node-a100-01", node: "us-east-1a", region: "US East", utilization: "84%", vram: "78%", temp: "72°C", queue: "4", throughput: "4.2k t/s", status: "Active", updated: new Date().toLocaleString() },
    { id: "node-h100-02", node: "us-west-2b", region: "US West", utilization: "92%", vram: "85%", temp: "76°C", queue: "12", throughput: "8.1k t/s", status: "Under Load", updated: new Date().toLocaleString() }
]`,
        fetchTarget: 'const res = await fetch("/api/epoch/ai-execution/gpu");',
        fetchReplacement: 'await new Promise(r => setTimeout(r, 600));\n            setGpus(MOCK_GPUS);\n            /* ',
        closeReplacement: '*/'
    },
    'ProviderHealthView.tsx': {
        constName: 'MOCK_HEALTH',
        data: `[
    { id: "ph-1", provider: "OpenAI", status: "Operational", latency: "245ms", errorRate: "0.01%", lastCheck: new Date().toLocaleString(), nextCheck: "in 2 mins" },
    { id: "ph-2", provider: "Anthropic", status: "Operational", latency: "310ms", errorRate: "0.05%", lastCheck: new Date().toLocaleString(), nextCheck: "in 2 mins" },
    { id: "ph-3", provider: "Google Vertex", status: "Degraded", latency: "850ms", errorRate: "4.2%", lastCheck: new Date().toLocaleString(), nextCheck: "in 1 min" }
]`,
        fetchTarget: 'const res = await fetch("/api/epoch/ai-execution/health");',
        fetchReplacement: 'await new Promise(r => setTimeout(r, 600));\n            setHealth(MOCK_HEALTH);\n            /* ',
        closeReplacement: '*/'
    },
    'CostsView.tsx': {
        constName: 'MOCK_COSTS',
        data: `[
    { id: "cst-1", provider: "OpenAI", model: "GPT-4o", tokens: "1.2M", cost: "$6.00", period: "Today", trend: "+12%" },
    { id: "cst-2", provider: "Anthropic", model: "Claude 3.5 Sonnet", tokens: "850K", cost: "$2.55", period: "Today", trend: "-4%" },
    { id: "cst-3", provider: "OpenAI", model: "O1-preview", tokens: "45K", cost: "$2.70", period: "Today", trend: "+45%" }
]`,
        fetchTarget: 'const res = await fetch("/api/epoch/ai-execution/costs");',
        fetchReplacement: 'await new Promise(r => setTimeout(r, 600));\n            setCosts(MOCK_COSTS);\n            /* ',
        closeReplacement: '*/'
    },
    'FailoversView.tsx': {
        constName: 'MOCK_FAILOVERS',
        data: `[
    { id: "fo-1", timestamp: new Date(Date.now() - 1000 * 60 * 15).toLocaleString(), originalProvider: "OpenAI", fallbackProvider: "Azure OpenAI", reason: "Rate Limit Exceeded (429)", status: "Success", duration: "12s" },
    { id: "fo-2", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toLocaleString(), originalProvider: "Anthropic", fallbackProvider: "OpenAI", reason: "Connection Timeout (522)", status: "Success", duration: "45s" }
]`,
        fetchTarget: 'const res = await fetch("/api/epoch/ai-execution/failovers");',
        fetchReplacement: 'await new Promise(r => setTimeout(r, 600));\n            setFailovers(MOCK_FAILOVERS);\n            /* ',
        closeReplacement: '*/'
    },
    'CapabilityMatrixView.tsx': {
        constName: 'MOCK_CAPABILITIES',
        data: `[
    { id: "cap-1", provider: "OpenAI", model: "GPT-4o", worker: "ReasoningAgent", coding: true, vision: true, ocr: true, audio: true, toolCalling: true, reasoning: false, structuredOutput: true, contextSize: "128k" },
    { id: "cap-2", provider: "Anthropic", model: "Claude 3.5 Sonnet", worker: "DevWorker", coding: true, vision: true, ocr: false, audio: false, toolCalling: true, reasoning: false, structuredOutput: true, contextSize: "200k" }
]`,
        fetchTarget: 'const res = await fetch("/api/epoch/ai-execution/capabilities");',
        fetchReplacement: 'await new Promise(r => setTimeout(r, 600));\n            setCapabilities(MOCK_CAPABILITIES);\n            /* ',
        closeReplacement: '*/'
    }
};

const dir = 'c:\\projects\\MemoryOS\\memoryos-frontend\\runtime\\ai-execution\\perspectives';
const files = fs.readdirSync(dir, { recursive: true });

files.forEach(f => {
    if (f.endsWith('View.tsx')) {
        const basename = path.basename(f);
        const mapping = mockDataMap[basename];
        if (!mapping) return;

        const fullPath = path.join(dir, f);
        let content = fs.readFileSync(fullPath, 'utf8');

        if (content.includes(mapping.constName)) return;

        // Insert mock data after imports
        content = content.replace(/(import .*;\n)+/, (match) => {
            return match + `\nconst ${mapping.constName} = ${mapping.data};\n\n`;
        });

        // Replace the fetch call with the mock setter and comment out the rest of the try block
        content = content.replace(mapping.fetchTarget, mapping.fetchReplacement);
        
        // Find the catch block and close the comment right before it
        content = content.replace('} catch (e) {', mapping.closeReplacement + '\n        } catch (e) {');

        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Mocked ' + basename);
    }
});
