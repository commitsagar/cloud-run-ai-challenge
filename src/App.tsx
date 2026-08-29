import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { JournalDashboard } from './components/JournalDashboard';
import { AuthLanding } from './components/AuthLanding';
import { ThreatModeler } from './components/ThreatModeler';
import { SecurityReviewer } from './components/SecurityReviewer';
import { FirestoreAuthStudio } from './components/FirestoreAuthStudio';
import { FallbackSandbox } from './components/FallbackSandbox';
import { WalkthroughGenerator } from './components/WalkthroughGenerator';
import { CloudRunDeployGuide } from './components/CloudRunDeployGuide';
import { AuditLogDrawer } from './components/AuditLogDrawer';
import { HealthResponse, TransactionRecord } from './types';
import { auth, onAuthStateChanged, type User } from './lib/firebase';
import { ShieldCheck, ArrowUpRight, Github, ExternalLink } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('journal');
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [auditLogs, setAuditLogs] = useState<TransactionRecord[]>([]);

  // 1. Firebase Authentication Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch (e) {
      console.error('Health fetch failed:', e);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/interactions');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.records || []);
      }
    } catch (e) {
      console.error('Audit fetch failed:', e);
    }
  };

  const handleClearAudit = async () => {
    try {
      const res = await fetch('/api/interactions', { method: 'DELETE' });
      if (res.ok) {
        setAuditLogs([]);
      }
    } catch (e) {
      console.error('Audit clear failed:', e);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchAuditLogs();
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0C10] text-[#E0E0E0] font-sans flex flex-col justify-between selection:bg-[#238636] selection:text-white">
      <div>
        {/* Navigation & Header */}
        <Header
          health={health}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          auditCount={auditLogs.length}
          user={user}
        />

        {/* Main Content Viewport */}
        <main className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-4 space-y-4">
          {activeTab === 'journal' && (
            authLoading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-2 border-[#58A6FF] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-mono text-[#8B949E]">Verifying Firebase Authentication...</span>
              </div>
            ) : user ? (
              <JournalDashboard 
                user={user} 
                onTransactionLogged={fetchAuditLogs} 
              />
            ) : (
              <AuthLanding onExploreWorkBench={() => setActiveTab('threat-model')} />
            )
          )}

          {activeTab === 'threat-model' && (
            <ThreatModeler onTransactionLogged={fetchAuditLogs} />
          )}

          {activeTab === 'security-reviewer' && (
            <SecurityReviewer onTransactionLogged={fetchAuditLogs} />
          )}

          {activeTab === 'firestore-auth' && (
            <FirestoreAuthStudio />
          )}

          {activeTab === 'fallback-sandbox' && (
            <FallbackSandbox onTransactionLogged={fetchAuditLogs} />
          )}

          {activeTab === 'walkthroughs' && (
            <WalkthroughGenerator onTransactionLogged={fetchAuditLogs} />
          )}

          {activeTab === 'deploy-guide' && (
            <CloudRunDeployGuide />
          )}

          {/* Persistent Transaction Audit Drawer */}
          <div className="pt-2">
            <AuditLogDrawer
              logs={auditLogs}
              onClear={handleClearAudit}
              onRefresh={fetchAuditLogs}
            />
          </div>
        </main>
      </div>

      {/* Production Standards High Density Footer */}
      <footer className="h-10 bg-[#0D1117] border-t border-[#2D333B] px-6 flex items-center justify-between text-[10px] font-mono text-[#8B949E] mt-8">
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#238636] shadow-[0_0_8px_#238636]" />
            <span className="text-[#3FB950] font-bold">SYSTEM_READY</span>
          </div>
          <span className="hidden sm:inline text-[#484F58]">|</span>
          <span className="hidden sm:inline">AUTH: GOOGLE FIREBASE</span>
          <span className="hidden sm:inline text-[#484F58]">|</span>
          <span className="hidden sm:inline">DB: CLOUD FIRESTORE</span>
          <span className="hidden sm:inline text-[#484F58]">|</span>
          <span>DEV_TUTORIAL: CLOUD-RUN-AI-CHALLENGE</span>
        </div>
        <div className="text-[#8B949E] uppercase tracking-wider hidden sm:block font-mono">
          GEMINI-3.6-FLASH // SECURE-FIRESTORE-ISOLATION
        </div>
      </footer>
    </div>
  );
}

