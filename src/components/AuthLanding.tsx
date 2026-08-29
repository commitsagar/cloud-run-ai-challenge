import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  Database, 
  Lock, 
  KeyRound, 
  LogIn, 
  ArrowRight, 
  CheckCircle2, 
  Flame, 
  Bot,
  Layers,
  FileText
} from 'lucide-react';
import { auth, googleProvider, signInWithPopup, signInAnonymously } from '../lib/firebase';

interface AuthLandingProps {
  onExploreWorkBench?: () => void;
}

export const AuthLanding: React.FC<AuthLandingProps> = ({ onExploreWorkBench }) => {
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        setAuthError('Popup was blocked by browser. You can enable popups or use Demo Account Sign-In below.');
      } else {
        setAuthError(err.message || 'Authentication failed. Please retry.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      await signInAnonymously(auth);
    } catch (err: any) {
      console.error('Anonymous Sign-In Error:', err);
      setAuthError(err.message || 'Guest sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Hero Welcome Card */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 bg-[#21262D] border-b border-[#30363D] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#3FB950] shadow-[0_0_8px_#3FB950]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#C9D1D9] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#58A6FF]" />
              Gemini 3.6 Flash & Cloud Firestore Reflection Platform
            </span>
          </div>
          <span className="text-[10px] font-mono bg-[#238636]/20 border border-[#238636]/40 text-[#3FB950] px-2.5 py-0.5 rounded font-semibold">
            Firebase Auth Ready
          </span>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-3 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F0F6FC] tracking-tight">
              Intelligent Personal Journaling & AI Reflection Companion
            </h2>
            <p className="text-sm text-[#8B949E] leading-relaxed">
              Capture daily reflections, brainstorm solutions, and converse with <span className="text-[#58A6FF] font-semibold">Gemini 3.6 Flash</span> in multi-turn dialogues. Every entry, insight, and summary is stored securely in <span className="text-[#3FB950] font-semibold">Cloud Firestore</span> with strict user-level isolation.
            </p>
          </div>

          {/* Auth Action Box */}
          <div className="bg-[#0D1117] border border-[#30363D] rounded-lg p-5 space-y-4 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-mono text-[#C9D1D9]">
              <Lock className="w-4 h-4 text-[#58A6FF]" />
              <span>Authentication Gate: Sign in to access your private dashboard</span>
            </div>

            {authError && (
              <div className="p-3 bg-[#F85149]/10 border border-[#F85149]/30 rounded text-xs text-[#F85149] font-mono leading-relaxed">
                {authError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                id="btn-google-sign-in"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="flex-1 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-bold font-mono py-2.5 px-4 rounded flex items-center justify-center gap-2 transition-all shadow-[0_0_12px_rgba(35,134,54,0.3)] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                <span>Sign In with Google</span>
              </button>

              <button
                id="btn-demo-sign-in"
                onClick={handleAnonymousSignIn}
                disabled={loading}
                className="bg-[#21262D] hover:bg-[#30363D] text-[#C9D1D9] border border-[#30363D] text-xs font-mono py-2.5 px-4 rounded flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                title="Sign in instantly with a sandbox guest user ID"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#58A6FF]" />
                <span>Guest / Sandbox Mode</span>
              </button>
            </div>

            <p className="text-[11px] text-[#8B949E] font-mono">
              🔒 No password storage. Credentials and session tokens are validated via Google Firebase Auth.
            </p>
          </div>

          {/* Architecture Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded bg-[#0D1117] border border-[#30363D] space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#E0E0E0]">
                <Flame className="w-4 h-4 text-[#FF7043]" />
                <span>Cloud Firestore</span>
              </div>
              <p className="text-[11px] text-[#8B949E] leading-relaxed font-mono">
                User-isolated subcollections (<code className="text-[#58A6FF]">/users/{'{uid}'}/journals</code>). Zero cross-tenant data access.
              </p>
            </div>

            <div className="p-3.5 rounded bg-[#0D1117] border border-[#30363D] space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#E0E0E0]">
                <Bot className="w-4 h-4 text-[#58A6FF]" />
                <span>Gemini 3.6 Flash</span>
              </div>
              <p className="text-[11px] text-[#8B949E] leading-relaxed font-mono">
                Multi-turn conversation engine, deep reflection synthesis, and instant key takeaway extraction.
              </p>
            </div>

            <div className="p-3.5 rounded bg-[#0D1117] border border-[#30363D] space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#E0E0E0]">
                <ShieldCheck className="w-4 h-4 text-[#3FB950]" />
                <span>Zero Hardcoding</span>
              </div>
              <p className="text-[11px] text-[#8B949E] leading-relaxed font-mono">
                Secret Manager & server-side API proxying. Secrets never exposed to client browsers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User Flow Specification Guide */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8B949E] flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-[#58A6FF]" />
          Production User Flow & Architecture
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-start gap-3 p-3 rounded bg-[#0D1117] border border-[#30363D]">
            <div className="w-6 h-6 rounded bg-[#58A6FF]/20 text-[#58A6FF] font-mono text-xs font-bold flex items-center justify-center shrink-0">
              1
            </div>
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-[#F0F6FC]">Authenticate with Google</div>
              <p className="text-[11px] text-[#8B949E] leading-relaxed font-mono">
                Sign in with Firebase Auth. Token is verified and establishes a unique <code className="text-[#58A6FF]">uid</code> for session persistence.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded bg-[#0D1117] border border-[#30363D]">
            <div className="w-6 h-6 rounded bg-[#58A6FF]/20 text-[#58A6FF] font-mono text-xs font-bold flex items-center justify-center shrink-0">
              2
            </div>
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-[#F0F6FC]">Private Multi-Turn Reflection</div>
              <p className="text-[11px] text-[#8B949E] leading-relaxed font-mono">
                Draft reflections and ask Gemini for feedback, brainstorming angles, or Socratic questions in real-time.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded bg-[#0D1117] border border-[#30363D]">
            <div className="w-6 h-6 rounded bg-[#58A6FF]/20 text-[#58A6FF] font-mono text-xs font-bold flex items-center justify-center shrink-0">
              3
            </div>
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-[#F0F6FC]">Automated Insights & Summaries</div>
              <p className="text-[11px] text-[#8B949E] leading-relaxed font-mono">
                Gemini extracts core themes, emotional tone, actionable micro-habits, and follow-up prompts for your entries.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded bg-[#0D1117] border border-[#30363D]">
            <div className="w-6 h-6 rounded bg-[#58A6FF]/20 text-[#58A6FF] font-mono text-xs font-bold flex items-center justify-center shrink-0">
              4
            </div>
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-[#F0F6FC]">Persistent & Isolated Archive</div>
              <p className="text-[11px] text-[#8B949E] leading-relaxed font-mono">
                All records persist strictly in your personal Firestore collection. Different users cannot access your documents.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
