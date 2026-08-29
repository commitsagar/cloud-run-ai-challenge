import React, { useState } from 'react';
import { CheckCircle2, Copy, Check, Sparkles, RefreshCw, FileText, ListOrdered, ShieldAlert, Cpu, Database } from 'lucide-react';

interface WalkthroughGeneratorProps {
  onTransactionLogged: () => void;
}

const PRESET_SCOPES = [
  {
    name: 'Production Directives Platform (Full Suite)',
    scope: 'Threat Modeler (5 Zones), Security Code Reviewer, Firestore Rules Tester, Resilient Gemini Fallback Ladder with 503 outage simulations, and Cloud Run Deploy Guide.',
    components: ['#btn-generate-threat-model', '#btn-run-security-audit', '#btn-execute-ai', '#toggle-simulate-503', '/api/interactions']
  },
  {
    name: 'User Authentication & Document Storage Flow',
    scope: 'Federated Google Sign-in, User Session Persistence, Owner-bound Firestore CRUD operations, and token refresh.',
    components: ['#btn-login-google', '#form-upload-doc', '#btn-save-interaction', '#toast-save-success']
  },
  {
    name: 'Autonomous Agent Tool Execution Loop',
    scope: 'Agent goal input, multi-step tool call planning, sandbox execution, error recovery fallback, and final report generation.',
    components: ['#input-agent-goal', '#btn-start-agent', '#tool-trace-viewer', '#btn-cancel-task']
  }
];

export const WalkthroughGenerator: React.FC<WalkthroughGeneratorProps> = ({ onTransactionLogged }) => {
  const [featureScope, setFeatureScope] = useState(PRESET_SCOPES[0].scope);
  const [componentsList, setComponentsList] = useState(PRESET_SCOPES[0].components);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!featureScope.trim()) return;
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const response = await fetch('/api/generate-walkthrough', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureScope,
          componentsList,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate walkthrough test suite.');
      }

      setReport(data.walkthroughReport);
      setModelUsed(data.modelUsed);
      onTransactionLogged();
    } catch (err: any) {
      setError(err.message || 'Error occurred during walkthrough generation.');
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
      {/* Banner */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 bg-[#21262D] border-b border-[#30363D] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9D1D9] font-mono flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3FB950]" />
              Directive 6: Functional Stability & User Interaction Walkthroughs
            </span>
          </div>
          <span className="text-[9px] bg-[#238636] text-white px-2 py-0.5 rounded font-mono font-bold">
            Automated QA
          </span>
        </div>

        <div className="p-4">
          <p className="text-xs text-[#8B949E] leading-relaxed">
            Every type of process and user interaction that a user can see or trigger must have a corresponding test case written out. Generates granular test steps that other coding tools can translate directly into Playwright, Cypress, or Jest automation scripts.
          </p>
        </div>
      </div>

      {/* Input and Output Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#161B22] border border-[#30363D] rounded-lg overflow-hidden flex flex-col">
            <div className="px-4 py-2 bg-[#21262D] border-b border-[#30363D] flex justify-between items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9D1D9] flex items-center gap-2">
                <ListOrdered className="w-3.5 h-3.5 text-[#3FB950]" />
                Target Feature Scope
              </span>
              <span className="text-[10px] text-[#8B949E] font-mono">Select Preset:</span>
            </div>

            <div className="p-4 space-y-3">
              {/* Presets */}
              <div className="flex flex-wrap gap-1.5">
                {PRESET_SCOPES.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setFeatureScope(p.scope);
                      setComponentsList(p.components);
                    }}
                    className="px-2 py-1 text-[10px] font-mono rounded bg-[#0D1117] hover:bg-[#21262D] text-[#8B949E] hover:text-[#C9D1D9] border border-[#30363D] transition-all text-left"
                  >
                    {p.name}
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#8B949E]">Feature Description & UI Flow</label>
                <textarea
                  rows={4}
                  value={featureScope}
                  onChange={(e) => setFeatureScope(e.target.value)}
                  placeholder="Describe features and interactions to generate test walkthroughs for..."
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded p-2.5 text-xs text-[#E0E0E0] placeholder-[#484F58] focus:outline-none focus:border-[#58A6FF] font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#8B949E]">Interactive Element Selectors (comma separated)</label>
                <input
                  type="text"
                  value={componentsList.join(', ')}
                  onChange={(e) => setComponentsList(e.target.value.split(',').map(s => s.trim()))}
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded px-2.5 py-1.5 text-xs text-[#E0E0E0] placeholder-[#484F58] focus:outline-none focus:border-[#58A6FF] font-mono"
                />
              </div>

              {error && (
                <div className="p-2.5 rounded bg-[#F85149]/10 border border-[#F85149]/50 text-[#F85149] text-[11px] font-mono">
                  {error}
                </div>
              )}

              <button
                id="btn-generate-walkthrough"
                onClick={handleGenerate}
                disabled={loading || !featureScope.trim()}
                className="w-full py-2 px-3 rounded bg-[#238636] hover:bg-[#2ea043] text-white font-mono text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_10px_rgba(35,134,54,0.3)]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing Test Matrix...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Test Walkthrough Suite</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Output */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#161B22] border border-[#30363D] rounded-lg min-h-[440px] flex flex-col justify-between overflow-hidden">
            <div>
              <div className="px-4 py-2 bg-[#21262D] border-b border-[#30363D] flex justify-between items-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9D1D9] flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-[#3FB950]" />
                  Generated Test Walkthrough Suite
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

              <div className="p-4">
                {loading ? (
                  <div className="py-20 flex flex-col items-center justify-center text-center space-y-2 font-mono">
                    <div className="w-8 h-8 rounded-full border-2 border-[#3FB950]/20 border-t-[#3FB950] animate-spin" />
                    <p className="text-[11px] text-[#8B949E]">
                      GENERATING SELECTORS, PRECONDITIONS, AND ASSERTIONS...
                    </p>
                  </div>
                ) : report ? (
                  <div className="bg-[#0D1117] rounded p-3 border border-[#30363D] text-[11px] text-[#A5D6FF] font-mono leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto">
                    {report}
                  </div>
                ) : (
                  <div className="py-16 flex flex-col items-center justify-center text-center space-y-2 text-[#484F58] font-mono">
                    <ListOrdered className="w-10 h-10 text-[#21262D]" />
                    <p className="text-[11px] max-w-sm">
                      Select a feature scope above to generate complete test walkthrough cases for all interactive triggers, buttons, and API flows.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-4 py-2 bg-[#0D1117] border-t border-[#30363D] flex items-center justify-between text-[10px] text-[#8B949E] font-mono">
              <span>DIRECTIVE 6 STANDARD: 100% INTERACTION COVERAGE</span>
              <span className="text-[#3FB950]">PLAYWRIGHT/CYPRESS READY</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
