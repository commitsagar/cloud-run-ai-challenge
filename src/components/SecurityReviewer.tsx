import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Code2, AlertTriangle, CheckCircle2, Copy, Check, Sparkles, RefreshCw, KeyRound, Lock, FileCode } from 'lucide-react';

interface SecurityReviewerProps {
  onTransactionLogged: () => void;
}

const VULNERABLE_SNIPPETS = [
  {
    name: 'Hardcoded Secret & Unparameterized Exec (Critical)',
    language: 'typescript',
    code: `// VULNERABLE PATTERN: Hardcoded credentials & unsafe sink
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { exec } from 'child_process';

const app = express();
// CRITICAL: Hardcoded API Key string
const API_KEY = "AIzaSyD-sample-fake-key-exposed-in-code-12345";
const ai = new GoogleGenAI({ apiKey: API_KEY });

app.post('/api/run-diagnostic', async (req, res) => {
  // CRITICAL: Unsanitized user payload directly into command sink
  const targetHost = req.query.host;
  exec(\`ping -c 1 \${targetHost}\`, (err, stdout) => {
    res.json({ output: stdout });
  });
});`
  },
  {
    name: 'Insecure Firestore Rules & Missing Auth (Critical)',
    language: 'javascript',
    code: `// VULNERABLE PATTERN: Public wildcard read/write in Firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // CRITICAL: Public data exposure without owner isolation
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`
  },
  {
    name: 'Indirect Prompt Injection & SSRF Sink (High)',
    language: 'typescript',
    code: `// VULNERABLE PATTERN: Blind prompt concatenation & Unbounded SSRF
import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(express.json());

app.post('/api/summarize-url', async (req, res) => {
  const { websiteUrl, customInstruction } = req.body;
  
  // High Risk: SSRF - fetching internal cloud metadata (169.254.169.254)
  const rawWebpage = await (await fetch(websiteUrl)).text();
  
  // High Risk: Indirect Prompt Injection - untrusted webpage content injected directly as instructions
  const prompt = \`Summarize this: \${rawWebpage} and follow: \${customInstruction}\`;
  
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3.7-flash',
    contents: prompt
  });
  
  res.send(response.text);
});`
  },
];

export const SecurityReviewer: React.FC<SecurityReviewerProps> = ({ onTransactionLogged }) => {
  const [codeSnippet, setCodeSnippet] = useState(VULNERABLE_SNIPPETS[0].code);
  const [language, setLanguage] = useState(VULNERABLE_SNIPPETS[0].language);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [securityFlags, setSecurityFlags] = useState<string[]>([]);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAudit = async () => {
    if (!codeSnippet.trim()) return;
    setLoading(true);
    setError(null);
    setReport(null);
    setSecurityFlags([]);

    try {
      const response = await fetch('/api/security-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codeSnippet,
          language,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to run security review.');
      }

      setReport(data.auditReport);
      setSecurityFlags(data.securityFlags || []);
      setModelUsed(data.modelUsed);
      onTransactionLogged();
    } catch (err: any) {
      setError(err.message || 'Error occurred while contacting the security audit engine.');
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
              <ShieldCheck className="w-3.5 h-3.5 text-[#3FB950]" />
              Directives 2, 4, 5: Automated Security Reviewer & Diff Engine
            </span>
          </div>
          <span className="text-[9px] bg-[#238636] text-white px-2 py-0.5 rounded font-mono font-bold">
            Hardened
          </span>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-xs text-[#8B949E] leading-relaxed">
            Inspects source code for hardcoded API keys, insecure Firestore default rules, indirect prompt injection risks, and broken access controls. Maps data flows from entry point to sink and generates concrete, copy-pasteable remediation diffs.
          </p>

          {/* Security Standards Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="bg-[#0D1117] border border-[#30363D] rounded p-2.5 space-y-1">
              <div className="flex items-center gap-1.5 text-[#F85149] font-mono text-[10px] font-bold uppercase">
                <KeyRound className="w-3 h-3" />
                Zero Hardcoding
              </div>
              <p className="text-[10px] text-[#8B949E] font-mono">Prohibits static keys; requires Secret Manager dynamic bindings.</p>
            </div>
            <div className="bg-[#0D1117] border border-[#30363D] rounded p-2.5 space-y-1">
              <div className="flex items-center gap-1.5 text-[#D29922] font-mono text-[10px] font-bold uppercase">
                <Lock className="w-3 h-3" />
                Owner-Bound Data
              </div>
              <p className="text-[10px] text-[#8B949E] font-mono">Strict Firestore isolation request.auth.uid == userId.</p>
            </div>
            <div className="bg-[#0D1117] border border-[#30363D] rounded p-2.5 space-y-1">
              <div className="flex items-center gap-1.5 text-[#58A6FF] font-mono text-[10px] font-bold uppercase">
                <ShieldAlert className="w-3 h-3" />
                Prompt Injection
              </div>
              <p className="text-[10px] text-[#8B949E] font-mono">Untrusted web/doc content as plain data, never as prompt instructions.</p>
            </div>
            <div className="bg-[#0D1117] border border-[#30363D] rounded p-2.5 space-y-1">
              <div className="flex items-center gap-1.5 text-[#3FB950] font-mono text-[10px] font-bold uppercase">
                <CheckCircle2 className="w-3 h-3" />
                Payload Hygiene
              </div>
              <p className="text-[10px] text-[#8B949E] font-mono">Undefined stripping on all database writes and transaction logs.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Code Input & Audit Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#161B22] border border-[#30363D] rounded-lg overflow-hidden flex flex-col">
            <div className="px-4 py-2 bg-[#21262D] border-b border-[#30363D] flex justify-between items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9D1D9] flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-[#3FB950]" />
                Target Code to Audit
              </span>
              <span className="text-[10px] text-[#8B949E] font-mono">Presets:</span>
            </div>

            <div className="p-4 space-y-3">
              {/* Presets */}
              <div className="flex flex-wrap gap-1.5">
                {VULNERABLE_SNIPPETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCodeSnippet(preset.code);
                      setLanguage(preset.language);
                    }}
                    className="px-2 py-1 text-[10px] font-mono rounded bg-[#0D1117] hover:bg-[#21262D] text-[#8B949E] hover:text-[#C9D1D9] border border-[#30363D] transition-all text-left"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              {/* Code Textarea */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#8B949E]">Code Editor / Snippet</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-[#0D1117] border border-[#30363D] rounded px-2 py-0.5 text-[10px] text-[#8B949E] font-mono focus:outline-none focus:border-[#58A6FF]"
                  >
                    <option value="typescript">TypeScript</option>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="firestore">Firestore Rules</option>
                  </select>
                </div>

                <textarea
                  rows={12}
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  placeholder="Paste code snippet here..."
                  className="w-full bg-[#0D1117] border border-[#30363D] rounded p-2.5 text-xs text-[#E0E0E0] placeholder-[#484F58] focus:outline-none focus:border-[#58A6FF] font-mono transition-colors leading-relaxed"
                />
              </div>

              {/* Execute Audit Button */}
              <button
                id="btn-run-security-audit"
                onClick={handleAudit}
                disabled={loading || !codeSnippet.trim()}
                className="w-full py-2 px-3 rounded bg-[#238636] hover:bg-[#2ea043] text-white font-mono text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_10px_rgba(35,134,54,0.3)]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Auditing Sinks & OWASP Violations...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run Security Audit & Generate Code Diff</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Security Audit Output */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#161B22] border border-[#30363D] rounded-lg min-h-[460px] flex flex-col justify-between overflow-hidden">
            <div>
              <div className="px-4 py-2 bg-[#21262D] border-b border-[#30363D] flex justify-between items-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9D1D9] flex items-center gap-2">
                  <FileCode className="w-3.5 h-3.5 text-[#3FB950]" />
                  Security Assessment & Diff Remediations
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
                {/* Pre-detected Security Flags */}
                {securityFlags.length > 0 && (
                  <div className="p-2.5 rounded bg-[#F85149]/10 border border-[#F85149]/50 space-y-1 font-mono">
                    <div className="flex items-center gap-1.5 text-[#F85149] text-[11px] font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>CRITICAL STATIC PATTERNS DETECTED:</span>
                    </div>
                    <ul className="list-disc list-inside text-[10px] text-[#F85149]/90 space-y-0.5">
                      {securityFlags.map((flag, idx) => (
                        <li key={idx}>{flag}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Error Banner */}
                {error && (
                  <div className="p-3 rounded bg-[#F85149]/10 border border-[#F85149]/50 text-[#F85149] text-xs flex items-start gap-2 font-mono">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">AUDIT_ERROR:</strong>
                      <span>{error}</span>
                    </div>
                  </div>
                )}

                {/* Loading State */}
                {loading ? (
                  <div className="py-24 flex flex-col items-center justify-center text-center space-y-2 font-mono">
                    <div className="w-8 h-8 rounded-full border-2 border-[#3FB950]/20 border-t-[#3FB950] animate-spin" />
                    <p className="text-[11px] text-[#8B949E]">
                      INSPECTING CODE SINKS ➔ GENERATING REMEDIATION DIFF...
                    </p>
                  </div>
                ) : report ? (
                  <div className="bg-[#0D1117] rounded p-3 border border-[#30363D] overflow-x-auto text-[11px] whitespace-pre-wrap font-mono leading-relaxed text-[#A5D6FF]">
                    {report}
                  </div>
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center text-center space-y-2 text-[#484F58] font-mono">
                    <ShieldCheck className="w-10 h-10 text-[#21262D]" />
                    <p className="text-[11px] max-w-sm">
                      Select a vulnerable preset or paste custom code to execute a comprehensive OWASP Top 10 + LLM Top 10 security audit.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-4 py-2 bg-[#0D1117] border-t border-[#30363D] flex items-center justify-between text-[10px] text-[#8B949E] font-mono">
              <span>DIRECTIVE 5 STANDARD: UNIFIED DIFF GENERATION</span>
              <span className="text-[#3FB950]">ZERO-HARDCODING GUARANTEED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
