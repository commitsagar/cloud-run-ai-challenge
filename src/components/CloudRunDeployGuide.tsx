import React, { useState } from 'react';
import { Terminal, Copy, Check, ShieldCheck, Tag, ExternalLink, KeyRound, Server, Cloud, Cpu, Layers } from 'lucide-react';

export const CloudRunDeployGuide: React.FC = () => {
  const [projectId, setProjectId] = useState('cloud-run-security-demo');
  const [region, setRegion] = useState('us-central1');
  const [serviceName, setServiceName] = useState('production-directives-platform');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const projectNumberPlaceholder = '${PROJECT_NUMBER}';

  const secretManagerCommands = `# 1. Create and populate the secret in Google Cloud Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Extract Project Number and identify the default Cloud Run service account
export PROJECT_NUMBER=$(gcloud projects describe ${projectId} --format='value(projectNumber)')
export SERVICE_ACCOUNT="\${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# 3. Grant the Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \\
  --member="serviceAccount:\${SERVICE_ACCOUNT}" \\
  --role="roles/secretmanager.secretAccessor"`;

  const deployCommand = `# Build and deploy container directly to Google Cloud Run
gcloud run deploy ${serviceName} \\
  --source . \\
  --region ${region} \\
  --platform managed \\
  --allow-unauthenticated \\
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \\
  --set-env-vars NODE_ENV=production`;

  const verificationCommand = `# MANDATORY DIRECTIVE 7: Apply Verification Label
gcloud run services update ${serviceName} \\
  --update-labels=dev-tutorial=cloud-run-ai-challenge \\
  --region=${region}

# Verify label application:
gcloud run services describe ${serviceName} --region=${region} --format="value(metadata.labels)"`;

  const pythonAccessPattern = `from google.cloud import secretmanager
import os

def access_secret(secret_id: str = "GEMINI_API_KEY", version_id: str = "latest") -> str:
    """Retrieve operational credentials dynamically using Secret Manager."""
    client = secretmanager.SecretManagerServiceClient()
    project_id = os.environ.get("GOOGLE_CLOUD_PROJECT", "${projectId}")
    name = f"projects/{project_id}/secrets/{secret_id}/versions/{version_id}"
    response = client.access_secret_version(request={"name": name})
    return response.payload.data.decode("UTF-8")`;

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 bg-[#21262D] border-b border-[#30363D] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9D1D9] font-mono flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-[#58A6FF]" />
              Directive 7: README Generator & Cloud Run Deployment Workbench
            </span>
          </div>
          <span className="text-[9px] bg-[#238636] text-white px-2 py-0.5 rounded font-mono font-bold">
            GCP Verified
          </span>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-xs text-[#8B949E] leading-relaxed">
            Step-by-step instructions for configuring Google Cloud APIs, Secret Manager IAM bindings, deploying to Cloud Run, and applying the mandatory <code className="text-[#58A6FF] font-mono">dev-tutorial=cloud-run-ai-challenge</code> verification label.
          </p>

          {/* Dynamic Project Config Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#8B949E]">GCP Project ID</label>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-[#0D1117] border border-[#30363D] rounded px-2.5 py-1.5 text-xs text-[#58A6FF] font-mono focus:outline-none focus:border-[#58A6FF]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#8B949E]">GCP Region</label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-[#0D1117] border border-[#30363D] rounded px-2.5 py-1.5 text-xs text-[#58A6FF] font-mono focus:outline-none focus:border-[#58A6FF]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#8B949E]">Cloud Run Service Name</label>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                className="w-full bg-[#0D1117] border border-[#30363D] rounded px-2.5 py-1.5 text-xs text-[#58A6FF] font-mono focus:outline-none focus:border-[#58A6FF]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Deployment Steps */}
      <div className="space-y-4">
        {/* Step 1: Secret Manager IAM Bindings */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-lg overflow-hidden flex flex-col">
          <div className="px-4 py-2 bg-[#21262D] border-b border-[#30363D] flex justify-between items-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9D1D9] flex items-center gap-2">
              <KeyRound className="w-3.5 h-3.5 text-[#58A6FF]" />
              1. Secret Manager Setup & Zero-Hardcoding Binding (Directive 4)
            </span>
            <button
              onClick={() => copyToClipboard(secretManagerCommands, 'secret')}
              className="px-2 py-0.5 rounded bg-[#0D1117] hover:bg-[#30363D] text-[#8B949E] hover:text-[#C9D1D9] border border-[#30363D] text-[10px] font-mono flex items-center gap-1 transition-all"
            >
              {copiedSection === 'secret' ? <Check className="w-3 h-3 text-[#3FB950]" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSection === 'secret' ? 'COPIED' : 'COPY'}</span>
            </button>
          </div>

          <div className="p-3">
            <div className="bg-[#0D1117] rounded p-3 border border-[#30363D] font-mono text-[11px] text-[#A5D6FF] overflow-x-auto leading-relaxed">
              <pre>{secretManagerCommands}</pre>
            </div>
          </div>
        </div>

        {/* Step 2: Cloud Run Deployment */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-lg overflow-hidden flex flex-col">
          <div className="px-4 py-2 bg-[#21262D] border-b border-[#30363D] flex justify-between items-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9D1D9] flex items-center gap-2">
              <Cloud className="w-3.5 h-3.5 text-[#58A6FF]" />
              2. Cloud Run Container Deployment
            </span>
            <button
              onClick={() => copyToClipboard(deployCommand, 'deploy')}
              className="px-2 py-0.5 rounded bg-[#0D1117] hover:bg-[#30363D] text-[#8B949E] hover:text-[#C9D1D9] border border-[#30363D] text-[10px] font-mono flex items-center gap-1 transition-all"
            >
              {copiedSection === 'deploy' ? <Check className="w-3 h-3 text-[#3FB950]" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSection === 'deploy' ? 'COPIED' : 'COPY'}</span>
            </button>
          </div>

          <div className="p-3">
            <div className="bg-[#0D1117] rounded p-3 border border-[#30363D] font-mono text-[11px] text-[#A5D6FF] overflow-x-auto leading-relaxed">
              <pre>{deployCommand}</pre>
            </div>
          </div>
        </div>

        {/* Step 3: Mandatory Campaign Verification Binding */}
        <div className="bg-[#161B22] border border-[#58A6FF]/40 rounded-lg overflow-hidden flex flex-col shadow-sm">
          <div className="px-4 py-2 bg-[#21262D] border-b border-[#30363D] flex justify-between items-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#58A6FF] flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-[#58A6FF]" />
              3. Mandatory Challenge Verification Labeling (Directive 7)
            </span>
            <button
              onClick={() => copyToClipboard(verificationCommand, 'verify')}
              className="px-2.5 py-0.5 rounded bg-[#238636] hover:bg-[#2ea043] text-white font-mono text-[10px] font-bold flex items-center gap-1 transition-all shadow-[0_0_10px_rgba(35,134,54,0.3)]"
            >
              {copiedSection === 'verify' ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSection === 'verify' ? 'COPIED' : 'COPY COMMAND'}</span>
            </button>
          </div>

          <div className="p-4 space-y-3">
            <p className="text-xs text-[#8B949E] leading-relaxed">
              Directive 7 requires applying the mandatory resource label <code className="text-[#58A6FF] font-mono bg-[#0D1117] px-1.5 py-0.5 rounded border border-[#30363D]">dev-tutorial=cloud-run-ai-challenge</code> to register the service for automated challenge verification:
            </p>

            <div className="bg-[#0D1117] rounded p-3 border border-[#30363D] font-mono text-[11px] text-[#58A6FF] overflow-x-auto leading-relaxed">
              <pre>{verificationCommand}</pre>
            </div>
          </div>
        </div>

        {/* Step 4: Python Secret Resolution Pattern */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-lg overflow-hidden flex flex-col">
          <div className="px-4 py-2 bg-[#21262D] border-b border-[#30363D] flex justify-between items-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9D1D9] flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-[#3FB950]" />
              4. Secret Manager Python Client Resolution (Zero Insecure Logging)
            </span>
            <button
              onClick={() => copyToClipboard(pythonAccessPattern, 'python')}
              className="px-2 py-0.5 rounded bg-[#0D1117] hover:bg-[#30363D] text-[#8B949E] hover:text-[#C9D1D9] border border-[#30363D] text-[10px] font-mono flex items-center gap-1 transition-all"
            >
              {copiedSection === 'python' ? <Check className="w-3 h-3 text-[#3FB950]" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSection === 'python' ? 'COPIED' : 'COPY'}</span>
            </button>
          </div>

          <div className="p-3">
            <div className="bg-[#0D1117] rounded p-3 border border-[#30363D] font-mono text-[11px] text-[#A5D6FF] overflow-x-auto leading-relaxed">
              <pre>{pythonAccessPattern}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
