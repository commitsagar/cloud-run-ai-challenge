import React, { useState } from 'react';
import { Cpu, Bug, ArrowDown, CheckCircle2, AlertTriangle, Sparkles, RefreshCw, Layers, Database, ShieldCheck } from 'lucide-react';

interface FallbackSandboxProps {
  onTransactionLogged: () => void;
}

const FALLBACK_LADDER_DISPLAY = [
  {
    tier: 'Tier 1 (Primary)',
    model: 'gemini-3.6-flash',
    desc: 'High-speed primary content generation engine',
    badge: 'Primary',
    color: 'border-cyan-500/50 text-cyan-400 bg-cyan-950/30',
  },
  {
    tier: 'Tier 2 (High-Availability Fallback)',
    model: 'gemini-3.1-flash-lite',
    desc: 'Ultra-low latency fallback on 503 / 429',
    badge: 'HA Fallback',
    color: 'border-blue-500/50 text-blue-400 bg-blue-950/30',
  },
  {
    tier: 'Tier 3 (Dynamic Alias)',
    model: 'gemini-flash-latest',
    desc: 'Always-available floating version alias',
    badge: 'Dynamic Alias',
    color: 'border-indigo-500/50 text-indigo-400 bg-indigo-950/30',
  },
  {
    tier: 'Tier 4 (Deep Reasoning Fallback)',
    model: 'gemini-3.7-flash',
    desc: 'Advanced reasoning catch-all fallback',
    badge: 'Deep Reasoning',
    color: 'border-purple-500/50 text-purple-400 bg-purple-950/30',
  },
];

export const FallbackSandbox: React.FC<FallbackSandboxProps> = ({ onTransactionLogged }) => {
  const [prompt, setPrompt] = useState('Explain how zero-trust architecture protects Cloud Run workloads communicating with Cloud Firestore and Secret Manager.');
  const [systemInstruction, setSystemInstruction] = useState('You are a Cloud Security Architect specializing in Google Cloud Platform.');
  const [simulateFailures, setSimulateFailures] = useState<string[]>(['gemini-3.6-flash']);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [fallbackTrace, setFallbackTrace] = useState<string[]>([]);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleSimulate = (model: string) => {
    setSimulateFailures(prev =>
      prev.includes(model) ? prev.filter(m => m !== model) : [...prev, model]
    );
  };

  const handleExecute = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setOutput(null);

    try {
      const response = await fetch('/api/gemini/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          systemInstruction,
          simulateFailures,
          // Testing defensive payload hygiene with intentional undefined properties
          _testUndefinedField: undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Execution failed across all ladder tiers.');
      }

      setOutput(data.output);
      setModelUsed(data.modelUsed);
      setFallbackTrace(data.fallbackTrace || []);
      setLatencyMs(data.latencyMs);
      setTransactionId(data.transactionId);
      onTransactionLogged();
    } catch (err: any) {
      setError(err.message || 'Error occurred during resilient model execution.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 bg-[#21262D] border-b border-[#30363D] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9D1D9] font-mono flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-[#58A6FF]" />
              Directive 6: Resilient Model Fallback Ladder & Recovery
            </span>
          </div>
          <span className="text-[9px] bg-[#238636] text-white px-2 py-0.5 rounded font-mono font-bold">
            Continuous HA
          </span>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-xs text-[#8B949E] leading-relaxed">
            Never execute single-point-of-failure AI requests. If upstream APIs return 503 Unavailable, 429 Resource Exhausted, 404, or 500, the automated ladder sequentially switches models to guarantee 99.99% service continuity.
          </p>

          {/* Fallback Ladder Visual Pipeline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {FALLBACK_LADDER_DISPLAY.map((tier, idx) => {
              const isFailing = simulateFailures.includes(tier.model);
              const isSelected = modelUsed === tier.model;
              return (
                <div
                  key={tier.model}
                  className={`relative rounded p-3 border transition-all ${
                    isFailing
                      ? 'border-[#F85149] bg-[#F85149]/10'
                      : isSelected
                      ? 'border-[#238636] bg-[#238636]/10 shadow-[0_0_10px_rgba(35,134,54,0.2)]'
                      : 'border-[#30363D] bg-[#0D1117]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#21262D] text-[#8B949E]">
                      Tier {idx + 1}
                    </span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border border-[#30363D] text-[#58A6FF]">
                      {tier.badge}
                    </span>
                  </div>

                  <h4 className="font-mono font-bold text-xs text-[#E0E0E0] truncate">{tier.model}</h4>
                  <p className="text-[10px] text-[#8B949E] mt-0.5">{tier.desc}</p>

                  <div className="mt-2.5 pt-2 border-t border-[#30363D] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleSimulate(tier.model)}
                      className={`text-[9px] font-mono px-2 py-0.5 rounded transition-all ${
                        isFailing
                          ? 'bg-[#F85149] text-white font-bold'
                          : 'bg-[#21262D] text-[#8B949E] hover:text-[#C9D1D9]'
                      }`}
                    >
                      {isFailing ? '[!!] 503 Active' : '[OK] Sim 503'}
                    </button>

                    {isSelected && (
                      <span className="text-[9px] text-[#3FB950] font-mono font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Served
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive Sandbox Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#161B22] border border-[#30363D] rounded-lg overflow-hidden flex flex-col">
            <div className="px-4 py-2 bg-[#21262D] border-b border-[#30363D] flex justify-between items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9D1D9] flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#58A6FF]" />
                Live Resilient Request Studio
              </span>
              <span className="text-[10px] text-[#8B949E] font-mono">Directive 6</span>
            </div>

            <div className="p-4 space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#8B949E]">System Instruction</label>
                <input
                  type="text"
                  value={systemInstruction}
                  onChange={(e) => setSystemInstruction(e.target.value)}
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded px-2.5 py-1.5 text-xs text-[#E0E0E0] placeholder-[#484F58] focus:outline-none focus:border-[#58A6FF] font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#8B949E]">User Prompt</label>
                <textarea
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter prompt to execute with automated failover..."
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded p-2.5 text-xs text-[#E0E0E0] placeholder-[#484F58] focus:outline-none focus:border-[#58A6FF] font-mono"
                />
              </div>

              {/* Zero-Crash Payload Guarantee Checklist */}
              <div className="p-2.5 rounded bg-[#0D1117] border border-[#30363D] space-y-1.5 text-xs font-mono">
                <div className="font-semibold text-[#C9D1D9] text-[10px] uppercase flex items-center gap-1.5">
                  <Database className="w-3 h-3 text-[#58A6FF]" />
                  <span>Resilience & Hygiene Guarantees</span>
                </div>
                <ul className="text-[10px] text-[#8B949E] space-y-1">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-2.5 h-2.5 text-[#3FB950] shrink-0" />
                    Top-level body parser mounted before routes
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-2.5 h-2.5 text-[#3FB950] shrink-0" />
                    Strict undefined-stripping on Firestore logs
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-2.5 h-2.5 text-[#3FB950] shrink-0" />
                    Sequential failover on 503, 429, 404, 500
                  </li>
                </ul>
              </div>

              <button
                id="btn-execute-ai"
                onClick={handleExecute}
                disabled={loading || !prompt.trim()}
                className="w-full py-2 px-3 rounded bg-[#238636] hover:bg-[#2ea043] text-white font-mono text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_10px_rgba(35,134,54,0.3)]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing Request Across Ladder...</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Execute with Resilient Fallback Ladder</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Execution Output & Hop Trace */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#161B22] border border-[#30363D] rounded-lg min-h-[440px] flex flex-col justify-between overflow-hidden">
            <div>
              <div className="px-4 py-2 bg-[#21262D] border-b border-[#30363D] flex justify-between items-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9D1D9] flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-[#58A6FF]" />
                  Resilient Generation Output
                </span>

                {transactionId && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0D1117] text-[#8B949E] border border-[#30363D]">
                    Tx: {transactionId}
                  </span>
                )}
              </div>

              <div className="p-4 space-y-3">
                {/* Hop Trace */}
                {fallbackTrace.length > 0 && (
                  <div className="p-2.5 rounded bg-[#0D1117] border border-[#30363D] space-y-1.5 font-mono">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8B949E] text-[11px]">
                        Active Model: <strong className="text-[#3FB950]">{modelUsed}</strong>
                      </span>
                      {latencyMs && <span className="text-[#8B949E] text-[11px]">{latencyMs}ms</span>}
                    </div>
                    <div className="flex flex-col gap-1 text-[10px]">
                      <span className="text-[#484F58]">Failover Trace:</span>
                      {fallbackTrace.map((step, idx) => (
                        <div
                          key={idx}
                          className={`px-2 py-0.5 rounded flex items-center gap-1.5 ${
                            step.includes('Success')
                              ? 'bg-[#238636]/20 text-[#3FB950] border border-[#238636]/40'
                              : step.includes('503') || step.includes('Failed')
                              ? 'bg-[#F85149]/20 text-[#F85149] border border-[#F85149]/40'
                              : 'bg-[#21262D] text-[#8B949E]'
                          }`}
                        >
                          {step.includes('Success') ? (
                            <CheckCircle2 className="w-3 h-3 text-[#3FB950] shrink-0" />
                          ) : step.includes('503') || step.includes('Failed') ? (
                            <AlertTriangle className="w-3 h-3 text-[#F85149] shrink-0" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-[#8B949E] shrink-0" />
                          )}
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="p-3 rounded bg-[#F85149]/10 border border-[#F85149]/50 text-[#F85149] text-xs flex items-start gap-2 font-mono">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">FALLBACK_CHAIN_EXHAUSTED:</strong>
                      <span>{error}</span>
                    </div>
                  </div>
                )}

                {/* Output Content */}
                {loading ? (
                  <div className="py-20 flex flex-col items-center justify-center text-center space-y-2 font-mono">
                    <div className="w-8 h-8 rounded-full border-2 border-[#58A6FF]/20 border-t-[#58A6FF] animate-spin" />
                    <p className="text-[11px] text-[#8B949E]">
                      ROUTING REQUEST THROUGH FALLBACK LADDER...
                    </p>
                  </div>
                ) : output ? (
                  <div className="bg-[#0D1117] rounded p-3 border border-[#30363D] text-[11px] text-[#A5D6FF] font-mono leading-relaxed whitespace-pre-wrap">
                    {output}
                  </div>
                ) : (
                  <div className="py-16 flex flex-col items-center justify-center text-center space-y-2 text-[#484F58] font-mono">
                    <Cpu className="w-10 h-10 text-[#21262D]" />
                    <p className="text-[11px] max-w-sm">
                      Toggle simulated outages on primary models above and execute to observe automatic failover.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-4 py-2 bg-[#0D1117] border-t border-[#30363D] flex items-center justify-between text-[10px] text-[#8B949E] font-mono">
              <span>AUTOMATIC FAILOVER: 503 / 429 / 404 / 500</span>
              <span className="text-[#3FB950]">INPUT-TO-PERSISTENCE VERIFIED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
