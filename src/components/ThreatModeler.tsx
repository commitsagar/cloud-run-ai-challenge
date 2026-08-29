import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, Cpu, ArrowRight, RefreshCw, Copy, Check, Sparkles, Layers, AlertTriangle, FileText, Bug } from 'lucide-react';
import { ThreatZone } from '../types';

interface ThreatModelerProps {
  onTransactionLogged: () => void;
}

const THREAT_ZONES_INFO: { zone: ThreatZone; icon: string; desc: string; risks: string[] }[] = [
  {
    zone: 'Input Surfaces',
    icon: '📥',
    desc: 'Prompts, untrusted user uploads, external API payloads, multimodal inputs',
    risks: ['Direct prompt injection', 'Malformed binary payload', 'XSS in vector storage'],
  },
  {
    zone: 'Planning & Reasoning',
    icon: '🧠',
    desc: 'Prompt injection, system instruction bypass, tool routing hijacking',
    risks: ['System prompt extraction', 'Adversarial jailbreaks', 'Goal hijacking in agent loops'],
  },
  {
    zone: 'Tool Execution',
    icon: '⚙️',
    desc: 'Privilege escalation via API functions, SSRF, dynamic code execution risks',
    risks: ['SSRF to cloud metadata (169.254.169.254)', 'Command injection in tool args', 'Unauthorized tool calls'],
  },
  {
    zone: 'Memory & State',
    icon: '💾',
    desc: 'Firestore state persistence, session hijacking, cross-user data leaks',
    risks: ['Cross-tenant read/write', 'Insecure Firestore defaults', 'Undefined payload corruption'],
  },
  {
    zone: 'Inter-System Communication',
    icon: '🌐',
    desc: 'External API calls (Google Maps, Google Sheets), token leakage',
    risks: ['Hardcoded GEMINI_API_KEY', 'Bearer token leakage in logs', 'Unencrypted egress'],
  },
];

const PRESETS = [
  {
    name: 'Multi-Tenant Document Summarizer with Firestore',
    feature: 'Users upload PDF/Doc contracts to be summarized by Gemini. Summaries and chat history are persisted in Cloud Firestore per user account with Google Sign-in.',
    context: 'Cloud Run backend (Express) + Google Cloud Firestore + Secret Manager for GEMINI_API_KEY + Firebase Auth federated tokens.'
  },
  {
    name: 'Autonomous Agent with Code Interpreter & Web Fetch',
    feature: 'AI agent plans multi-step tasks, queries external REST APIs, executes Python scripts in a sandbox, and writes reports to Google Drive.',
    context: 'Agentic tool-use loop with dynamic function calling, external HTTP requests, and temporary disk storage.'
  },
  {
    name: 'User Profile & Financial Analytics Dashboard',
    feature: 'Users view personalized banking analytics, trigger automated budget projections via Gemini, and configure alert webhooks.',
    context: 'Firestore database with private subcollections (/users/{userId}/interactions), Cloud Run proxy, Google Secret Manager.'
  },
];

export const ThreatModeler: React.FC<ThreatModelerProps> = ({ onTransactionLogged }) => {
  const [featureDescription, setFeatureDescription] = useState(PRESETS[0].feature);
  const [architectureContext, setArchitectureContext] = useState(PRESETS[0].context);
  const [simulateFailures, setSimulateFailures] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [fallbackTrace, setFallbackTrace] = useState<string[]>([]);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSimulateFailure = (model: string) => {
    setSimulateFailures(prev => 
      prev.includes(model) ? prev.filter(m => m !== model) : [...prev, model]
    );
  };

  const handleGenerate = async () => {
    if (!featureDescription.trim()) return;
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const response = await fetch('/api/threat-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureDescription,
          architectureContext,
          simulateFailures,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate threat model.');
      }

      setReport(data.threatReport);
      setModelUsed(data.modelUsed);
      setFallbackTrace(data.fallbackTrace || []);
      setLatencyMs(data.latencyMs);
      onTransactionLogged();
    } catch (err: any) {
      setError(err.message || 'Error occurred while communicating with threat model endpoint.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!report) return;
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Overview Banner */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 bg-[#21262D] border-b border-[#30363D] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9D1D9] font-mono flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-[#58A6FF]" />
              Directive 1: Agentic Threat Model // 5-Zone Analysis
            </span>
          </div>
          <span className="text-[9px] bg-[#238636] text-white px-2 py-0.5 rounded font-mono font-bold">
            Validated
          </span>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-xs text-[#8B949E] leading-relaxed">
            Every system architecture and feature must undergo structured threat modeling across all five critical zones before deployment. Generates a strict Threat Summary Table mapping attack scenarios to concrete countermeasures.
          </p>

          {/* 5 Threat Zones Table */}
          <div className="border border-[#30363D] rounded bg-[#0D1117] overflow-x-auto">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="text-[#8B949E] text-left border-b border-[#30363D] bg-[#161B22]/60">
                  <th className="p-2 font-medium uppercase font-mono w-44">Threat Zone</th>
                  <th className="p-2 font-medium uppercase font-mono">Scope & Surfaces</th>
                  <th className="p-2 font-medium uppercase font-mono">Primary Attack Risks</th>
                </tr>
              </thead>
              <tbody className="font-mono divide-y divide-[#21262D]">
                {THREAT_ZONES_INFO.map((item) => (
                  <tr key={item.zone} className="hover:bg-[#161B22]/40 transition-colors">
                    <td className="p-2 text-[#58A6FF] font-semibold whitespace-nowrap">
                      {item.icon} {item.zone}
                    </td>
                    <td className="p-2 text-[#C9D1D9] text-[11px] font-sans">
                      {item.desc}
                    </td>
                    <td className="p-2 text-[#3FB950] text-[10px]">
                      {item.risks.join(' • ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Interactive Input Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#161B22] border border-[#30363D] rounded-lg overflow-hidden flex flex-col">
            <div className="px-4 py-2 bg-[#21262D] border-b border-[#30363D] flex justify-between items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9D1D9] flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-[#58A6FF]" />
                Feature Specification
              </span>
              <span className="text-[10px] text-[#8B949E] font-mono">Select Preset:</span>
            </div>

            <div className="p-4 space-y-3">
              {/* Presets */}
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setFeatureDescription(p.feature);
                      setArchitectureContext(p.context);
                    }}
                    className="px-2 py-1 text-[10px] font-mono rounded bg-[#0D1117] hover:bg-[#21262D] text-[#8B949E] hover:text-[#C9D1D9] border border-[#30363D] transition-all text-left"
                  >
                    {p.name}
                  </button>
                ))}
              </div>

              {/* Feature Description Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#8B949E]">Target Feature & Data Flows</label>
                <textarea
                  id="input-feature-description"
                  rows={4}
                  value={featureDescription}
                  onChange={(e) => setFeatureDescription(e.target.value)}
                  placeholder="Describe the feature, user interactions, prompt flows, and tool calls..."
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded p-2.5 text-xs text-[#E0E0E0] placeholder-[#484F58] focus:outline-none focus:border-[#58A6FF] font-mono transition-colors"
                />
              </div>

              {/* Architecture Context */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#8B949E]">Infrastructure & Storage Context</label>
                <input
                  type="text"
                  value={architectureContext}
                  onChange={(e) => setArchitectureContext(e.target.value)}
                  placeholder="e.g. Cloud Run + Firestore + Secret Manager"
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded px-2.5 py-1.5 text-xs text-[#E0E0E0] placeholder-[#484F58] focus:outline-none focus:border-[#58A6FF] font-mono transition-colors"
                />
              </div>

              {/* Simulated Failure Resilience Tester (Directive 6) */}
              <div className="pt-2 border-t border-[#30363D] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#8B949E] flex items-center gap-1.5">
                    <Bug className="w-3 h-3 text-[#D29922]" />
                    Directive 6 Fallback Ladder Test
                  </span>
                  <span className="text-[9px] font-mono text-[#484F58]">Simulate Outages</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {['gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'].map((mod) => {
                    const isSim = simulateFailures.includes(mod);
                    return (
                      <button
                        key={mod}
                        type="button"
                        onClick={() => toggleSimulateFailure(mod)}
                        className={`px-1.5 py-1 rounded text-[9px] font-mono text-center transition-all border ${
                          isSim
                            ? 'bg-[#F85149]/20 border-[#F85149] text-[#F85149] font-bold'
                            : 'bg-[#0D1117] border-[#30363D] text-[#8B949E] hover:text-[#C9D1D9]'
                        }`}
                      >
                        {isSim ? `[!!] 503 ${mod.replace('gemini-', '')}` : `[OK] ${mod.replace('gemini-', '')}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Execute Button */}
              <button
                id="btn-generate-threat-model"
                onClick={handleGenerate}
                disabled={loading || !featureDescription.trim()}
                className="w-full py-2 px-3 rounded bg-[#238636] hover:bg-[#2ea043] text-white font-mono text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_10px_rgba(35,134,54,0.3)]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Auditing 5 Zones & Fallback Ladder...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Mandatory Threat Summary Table</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Output Report Area */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#161B22] border border-[#30363D] rounded-lg min-h-[440px] flex flex-col justify-between overflow-hidden">
            <div>
              <div className="px-4 py-2 bg-[#21262D] border-b border-[#30363D] flex justify-between items-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9D1D9] flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-[#58A6FF]" />
                  Threat Modeling Audit Matrix
                </span>

                {report && (
                  <button
                    onClick={handleCopy}
                    className="px-2 py-0.5 rounded bg-[#0D1117] hover:bg-[#30363D] text-[#8B949E] hover:text-[#C9D1D9] border border-[#30363D] text-[10px] font-mono flex items-center gap-1 transition-all"
                  >
                    {copied ? <Check className="w-3 h-3 text-[#3FB950]" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'COPIED' : 'COPY'}</span>
                  </button>
                )}
              </div>

              <div className="p-4 space-y-3">
                {/* Status and Fallback Trace Bar */}
                {fallbackTrace.length > 0 && (
                  <div className="p-2.5 rounded bg-[#0D1117] border border-[#30363D] space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#8B949E]">Model: <strong className="text-[#58A6FF]">{modelUsed}</strong></span>
                      {latencyMs && <span className="text-[#8B949E]">{latencyMs}ms</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-1 text-[10px]">
                      <span className="text-[#484F58]">Ladder Trace:</span>
                      {fallbackTrace.map((step, idx) => (
                        <span
                          key={idx}
                          className={`px-1.5 py-0.5 rounded ${
                            step.includes('Success')
                              ? 'bg-[#238636]/20 text-[#3FB950] border border-[#238636]/40'
                              : step.includes('503') || step.includes('Failed')
                              ? 'bg-[#F85149]/20 text-[#F85149] border border-[#F85149]/40'
                              : 'bg-[#21262D] text-[#8B949E]'
                          }`}
                        >
                          {step}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="p-3 rounded bg-[#F85149]/10 border border-[#F85149]/50 text-[#F85149] text-xs flex items-start gap-2 font-mono">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">EXECUTION_ERROR:</strong>
                      <span>{error}</span>
                    </div>
                  </div>
                )}

                {/* Generated Content or Placeholder */}
                {loading ? (
                  <div className="py-20 flex flex-col items-center justify-center text-center space-y-2 font-mono">
                    <div className="w-8 h-8 rounded-full border-2 border-[#58A6FF]/20 border-t-[#58A6FF] animate-spin" />
                    <p className="text-[11px] text-[#8B949E]">
                      EVALUATING 5 ZONES ➔ TRACING SINK PATHS...
                    </p>
                  </div>
                ) : report ? (
                  <div className="bg-[#0D1117] rounded p-3 border border-[#30363D] overflow-x-auto text-[11px] whitespace-pre-wrap font-mono leading-relaxed text-[#A5D6FF]">
                    {report}
                  </div>
                ) : (
                  <div className="py-16 flex flex-col items-center justify-center text-center space-y-2 text-[#484F58] font-mono">
                    <ShieldAlert className="w-10 h-10 text-[#21262D]" />
                    <p className="text-[11px] max-w-sm">
                      Select a preset above or input architecture specification to synthesize the mandatory 5-Zone Threat Summary Table.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-4 py-2 bg-[#0D1117] border-t border-[#30363D] flex items-center justify-between text-[10px] text-[#8B949E] font-mono">
              <span>MANDATORY DIRECTIVE 1: THREAT SUMMARY TABLE</span>
              <span className="text-[#3FB950]">OWASP TOP 10 + LLM TOP 10</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
