import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Cpu, 
  Database, 
  KeyRound, 
  Terminal, 
  CheckCircle2, 
  Activity, 
  BookOpen, 
  Sparkles, 
  LogOut, 
  LogIn 
} from 'lucide-react';
import { HealthResponse } from '../types';
import { type User, signOut, auth, googleProvider, signInWithPopup } from '../lib/firebase';

interface HeaderProps {
  health: HealthResponse | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  auditCount: number;
  user: User | null;
}

export const Header: React.FC<HeaderProps> = ({ 
  health, 
  activeTab, 
  setActiveTab, 
  auditCount,
  user 
}) => {
  const tabs = [
    { id: 'journal', label: '💬 AI Journal & Reflection', icon: BookOpen, primary: true },
    { id: 'threat-model', label: '1. Threat Modeler', icon: ShieldAlert },
    { id: 'security-reviewer', label: '2. Code Auditor', icon: ShieldCheck },
    { id: 'firestore-auth', label: '3. Firestore & RBAC', icon: Database },
    { id: 'fallback-sandbox', label: '4. Resilient Fallback', icon: Cpu },
    { id: 'walkthroughs', label: '5. QA Walkthroughs', icon: CheckCircle2 },
    { id: 'deploy-guide', label: '6. Cloud Run Deploy', icon: Terminal },
  ];

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Sign out error:', e);
    }
  };

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error('Sign in error:', e);
    }
  };

  return (
    <header className="border-b border-[#2D333B] bg-[#0D1117] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#238636] shadow-[0_0_8px_#238636]" />
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-bold tracking-widest uppercase text-[#8B949E]">
                Sentinel OS <span className="text-[#484F58]">//</span> <span className="text-[#C9D1D9]">AI Reflection & Directives</span>
              </h1>
              <span className="hidden sm:inline text-[9px] bg-[#238636] text-white px-2 py-0.5 rounded font-mono font-bold">
                Firestore Ready
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-mono uppercase text-[#484F58]">
            <div className="hidden lg:flex items-center gap-3">
              <span>
                Model: <strong className="text-[#3FB950]">Gemini 3.6 Flash</strong>
              </span>
              <span>
                DB: <strong className="text-[#58A6FF]">Cloud Firestore</strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#161B22] border border-[#30363D] text-[#8B949E]">
              <Activity className="w-3 h-3 text-[#58A6FF]" />
              <span className="text-[#58A6FF] font-bold">{auditCount}</span>
              <span className="hidden sm:inline">Events</span>
            </div>

            {/* Auth Button */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-[#30363D]">
                <span className="text-[#C9D1D9] font-bold truncate max-w-[100px] hidden sm:inline">
                  {user.displayName || user.email?.split('@')[0] || 'User'}
                </span>
                <button
                  id="btn-header-signout"
                  onClick={handleSignOut}
                  className="px-2 py-1 rounded bg-[#21262D] hover:bg-[#F85149]/20 text-[#8B949E] hover:text-[#F85149] border border-[#30363D] flex items-center gap-1 transition-all"
                  title="Sign out of Firebase Auth"
                >
                  <LogOut className="w-3 h-3" />
                  <span className="hidden sm:inline">SIGN OUT</span>
                </button>
              </div>
            ) : (
              <button
                id="btn-header-signin"
                onClick={handleSignIn}
                className="px-2.5 py-1 rounded bg-[#238636] hover:bg-[#2ea043] text-white font-bold flex items-center gap-1 transition-all shadow-[0_0_8px_rgba(35,134,54,0.3)]"
              >
                <LogIn className="w-3 h-3" />
                <span>SIGN IN</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto gap-1 border-t border-[#2D333B]/60 py-1.5 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-mono font-medium whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-[#21262D] text-[#F0F6FC] border-[#30363D] shadow-sm font-bold'
                    : tab.primary
                    ? 'text-[#58A6FF] hover:bg-[#161B22] border-transparent font-bold'
                    : 'text-[#8B949E] hover:text-[#C9D1D9] hover:bg-[#161B22] border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#58A6FF]' : tab.primary ? 'text-[#58A6FF]' : 'text-[#8B949E]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

