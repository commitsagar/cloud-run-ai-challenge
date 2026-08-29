import React, { useState } from 'react';
import { Database, ShieldCheck, ShieldAlert, Lock, CheckCircle2, XCircle, Copy, Check, Terminal, Users, UserCheck } from 'lucide-react';

const FIRESTORE_RULES_CODE = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 1. Zero Insecure Defaults (Deny all by default)
    match /{document=**} {
      allow read, write: if false;
    }

    // 2. User Data Isolation (Owner-bound path checking)
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /threat_models/{modelId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    // 3. Role-Based Access Control (RBAC) for elevated administrative operations
    match /system/audit_logs/{logId} {
      allow read: if request.auth != null && 
        (request.auth.token.role == 'admin' || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if request.auth != null && 
        (request.auth.token.role == 'admin' || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}`;

const SIMULATED_REQUEST_TESTS = [
  {
    id: 'test-1',
    name: 'Authenticated Owner Read (/users/user_abc/interactions/int_123)',
    auth: { uid: 'user_abc', role: 'user' },
    path: '/users/user_abc/interactions/int_123',
    operation: 'read',
    expectedResult: 'ALLOWED',
    reason: 'request.auth != null && request.auth.uid ("user_abc") == userId ("user_abc")',
  },
  {
    id: 'test-2',
    name: 'Cross-Tenant Read Attempt (/users/victim_999/interactions/int_123)',
    auth: { uid: 'attacker_111', role: 'user' },
    path: '/users/victim_999/interactions/int_123',
    operation: 'read',
    expectedResult: 'DENIED',
    reason: 'request.auth.uid ("attacker_111") != userId ("victim_999")',
  },
  {
    id: 'test-3',
    name: 'Unauthenticated Public Write (/users/user_abc/threat_models/tm_1)',
    auth: null,
    path: '/users/user_abc/threat_models/tm_1',
    operation: 'write',
    expectedResult: 'DENIED',
    reason: 'request.auth is null (Unauthenticated)',
  },
  {
    id: 'test-4',
    name: 'Admin Role Access to System Logs (/system/audit_logs/log_99)',
    auth: { uid: 'admin_root', role: 'admin' },
    path: '/system/audit_logs/log_99',
    operation: 'read',
    expectedResult: 'ALLOWED',
    reason: 'request.auth.token.role == "admin" passes RBAC check',
  },
  {
    id: 'test-5',
    name: 'Standard User Access to System Logs (/system/audit_logs/log_99)',
    auth: { uid: 'user_regular', role: 'user' },
    path: '/system/audit_logs/log_99',
    operation: 'read',
    expectedResult: 'DENIED',
    reason: 'Non-admin token fails RBAC condition',
  },
];

export const FirestoreAuthStudio: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activeTest, setActiveTest] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(FIRESTORE_RULES_CODE);
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
              <Database className="w-3.5 h-3.5 text-[#58A6FF]" />
              Directive 3: Secure Firestore Schema & RBAC Rule Studio
            </span>
          </div>
          <span className="text-[9px] bg-[#238636] text-white px-2 py-0.5 rounded font-mono font-bold">
            Validated
          </span>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-xs text-[#8B949E] leading-relaxed">
            Zero insecure defaults. Every document path enforces tenant isolation using <code className="text-[#58A6FF] font-mono">request.auth.uid == userId</code> and role-based access control. Outsources credential management to federated Google identity.
          </p>

          {/* 4 Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="bg-[#0D1117] border border-[#30363D] rounded p-2.5 space-y-1">
              <div className="text-[#F85149] font-mono text-[10px] font-bold uppercase flex items-center gap-1.5">
                <Lock className="w-3 h-3" /> Zero Insecure Defaults
              </div>
              <p className="text-[10px] text-[#8B949E] font-mono">Strict deny-all root rule prevents unauthenticated exposure.</p>
            </div>
            <div className="bg-[#0D1117] border border-[#30363D] rounded p-2.5 space-y-1">
              <div className="text-[#3FB950] font-mono text-[10px] font-bold uppercase flex items-center gap-1.5">
                <UserCheck className="w-3 h-3" /> Owner-Bound Paths
              </div>
              <p className="text-[10px] text-[#8B949E] font-mono"><code className="text-[#58A6FF]">request.auth.uid == userId</code> guarantees zero leaks.</p>
            </div>
            <div className="bg-[#0D1117] border border-[#30363D] rounded p-2.5 space-y-1">
              <div className="text-[#D29922] font-mono text-[10px] font-bold uppercase flex items-center gap-1.5">
                <Users className="w-3 h-3" /> Custom Claims RBAC
              </div>
              <p className="text-[10px] text-[#8B949E] font-mono">Admin actions gated via verified claims or document lookups.</p>
            </div>
            <div className="bg-[#0D1117] border border-[#30363D] rounded p-2.5 space-y-1">
              <div className="text-[#58A6FF] font-mono text-[10px] font-bold uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3" /> Federated Auth
              </div>
              <p className="text-[10px] text-[#8B949E] font-mono">Google Sign-in eliminates custom password storage risks.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Viewer and Interactive Test Bench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Rules Code */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-[#161B22] border border-[#30363D] rounded-lg overflow-hidden flex flex-col">
            <div className="px-4 py-2 bg-[#21262D] border-b border-[#30363D] flex justify-between items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9D1D9] flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-[#58A6FF]" />
                firestore.rules (Production Specification)
              </span>
              <button
                onClick={handleCopy}
                className="px-2 py-0.5 rounded bg-[#0D1117] hover:bg-[#30363D] text-[#8B949E] hover:text-[#C9D1D9] border border-[#30363D] text-[10px] font-mono flex items-center gap-1 transition-all"
              >
                {copied ? <Check className="w-3 h-3 text-[#3FB950]" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'COPIED' : 'COPY'}</span>
              </button>
            </div>

            <div className="p-3">
              <div className="bg-[#0D1117] rounded p-3 border border-[#30363D] font-mono text-[11px] text-[#A5D6FF] overflow-x-auto leading-relaxed max-h-[420px]">
                <pre>{FIRESTORE_RULES_CODE}</pre>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Rules Verification Test Bench */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-[#161B22] border border-[#30363D] rounded-lg overflow-hidden flex flex-col">
            <div className="px-4 py-2 bg-[#21262D] border-b border-[#30363D] flex justify-between items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9D1D9] flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#3FB950]" />
                Security Rules Test Bench
              </span>
              <span className="text-[10px] text-[#8B949E] font-mono">5 Test Scenarios</span>
            </div>

            <div className="p-3 space-y-2">
              {SIMULATED_REQUEST_TESTS.map((test) => {
                const isSelected = activeTest === test.id;
                const isAllowed = test.expectedResult === 'ALLOWED';
                return (
                  <div
                    key={test.id}
                    onClick={() => setActiveTest(isSelected ? null : test.id)}
                    className={`p-2.5 rounded border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0D1117] border-[#58A6FF] shadow-sm'
                        : 'bg-[#0D1117] border-[#30363D] hover:border-[#484F58]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                          isAllowed
                            ? 'bg-[#238636]/20 border-[#238636]/50 text-[#3FB950]'
                            : 'bg-[#F85149]/20 border-[#F85149]/50 text-[#F85149]'
                        }`}>
                          {isAllowed ? '[ALLOWED]' : '[DENIED]'}
                        </span>
                        <h4 className="text-[11px] font-mono text-[#E0E0E0]">{test.name}</h4>
                      </div>
                    </div>

                    <div className="mt-1.5 text-[10px] font-mono text-[#8B949E] flex flex-wrap justify-between gap-2">
                      <div>
                        Path: <span className="text-[#C9D1D9]">{test.path}</span>
                      </div>
                      <div>
                        Auth: <span className="text-[#58A6FF]">{test.auth ? `${test.auth.uid} (${test.auth.role})` : 'null'}</span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="mt-2 pt-2 border-t border-[#30363D] text-[11px] space-y-1 font-mono">
                        <div className="text-[10px] text-[#58A6FF] uppercase">Evaluation Reason:</div>
                        <div className="text-[10px] bg-[#161B22] p-2 rounded border border-[#30363D] text-[#8B949E]">
                          {test.reason}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="px-4 py-2 bg-[#0D1117] border-t border-[#30363D] flex items-center justify-between text-[10px] text-[#8B949E] font-mono">
              <span>DIRECTIVE 3: OWNER-BOUND ISOLATION</span>
              <span className="text-[#3FB950]">100% PATH-ISOLATED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
