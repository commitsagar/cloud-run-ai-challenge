import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Sparkles, 
  Activity, 
  BrainCircuit, 
  CheckCircle2, 
  Circle, 
  RefreshCw, 
  TrendingUp, 
  Target, 
  ShieldCheck, 
  Flame, 
  Zap, 
  Share2, 
  Download, 
  FileText, 
  Lightbulb, 
  ArrowRight,
  Info,
  ChevronRight,
  Layers,
  Compass
} from 'lucide-react';
import { 
  db, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  onSnapshot, 
  type User 
} from '../lib/firebase';
import { JournalSession, CognitiveGraphData, CognitiveNode, MicroHabit } from '../types';

interface CognitiveMindMapProps {
  user: User;
  sessions: JournalSession[];
  onOpenJournalSession?: (sessionId: string) => void;
  onExplorePromptInChat?: (promptText: string) => void;
}

export const CognitiveMindMap: React.FC<CognitiveMindMapProps> = ({
  user,
  sessions,
  onOpenJournalSession,
  onExplorePromptInChat,
}) => {
  const [graphData, setGraphData] = useState<CognitiveGraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<CognitiveNode | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [habits, setHabits] = useState<MicroHabit[]>([]);
  const [streakDays, setStreakDays] = useState<number>(3);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // 1. Subscribe / Load Habits from Firestore
  useEffect(() => {
    if (!user || !user.uid) return;

    const habitDocRef = doc(db, 'users', user.uid, 'settings', 'habits_tracker');
    const unsubscribe = onSnapshot(habitDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.habits)) {
          setHabits(data.habits);
        }
        if (typeof data.streakDays === 'number') {
          setStreakDays(data.streakDays);
        }
      }
    });

    return () => unsubscribe();
  }, [user.uid]);

  // 2. Synthesize Cognitive Graph from User's Journal Corpus
  const handleSynthesizeGraph = async () => {
    if (sessions.length === 0) return;

    setLoading(true);
    setSyncStatus('Synthesizing multi-session cognitive graph with Gemini 3.6 Flash...');

    try {
      // Fetch full message snapshots for the most recent sessions
      const sessionPayloads = await Promise.all(
        sessions.slice(0, 8).map(async (s) => {
          try {
            const msgCollection = collection(db, 'users', user.uid, 'journals', s.id, 'messages');
            const msgSnap = await getDocs(msgCollection);
            const msgs: any[] = [];
            msgSnap.forEach(d => msgs.push(d.data()));
            return {
              id: s.id,
              title: s.title,
              mood: s.mood,
              summary: s.summary,
              lastMessageSnippet: s.lastMessageSnippet,
              messages: msgs,
            };
          } catch (e) {
            return {
              id: s.id,
              title: s.title,
              mood: s.mood,
              summary: s.summary,
              lastMessageSnippet: s.lastMessageSnippet,
              messages: [],
            };
          }
        })
      );

      const res = await fetch('/api/journal/cognitive-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessions: sessionPayloads }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setGraphData(json.data);
        if (json.data.nodes?.length > 0) {
          setSelectedNode(json.data.nodes[0]);
        }

        // Initialize micro-habits if not already persisted
        if (json.data.microHabits && habits.length === 0) {
          const initialHabits = json.data.microHabits.map((h: any) => ({
            ...h,
            completed: false,
          }));
          setHabits(initialHabits);
          
          // Save to Firestore
          const habitDocRef = doc(db, 'users', user.uid, 'settings', 'habits_tracker');
          await setDoc(habitDocRef, {
            habits: initialHabits,
            streakDays: 3,
            updatedAt: Date.now(),
          }, { merge: true });
        }

        setSyncStatus(`Graph generated from ${sessionPayloads.length} reflection entries via ${json.modelUsed || 'Gemini 3.6 Flash'}`);
      } else {
        setSyncStatus('Failed to synthesize: ' + (json.error || 'Unknown error'));
      }
    } catch (err: any) {
      console.error('Synthesize graph error:', err);
      setSyncStatus('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial synthesis trigger on first view if sessions exist
  useEffect(() => {
    if (sessions.length > 0 && !graphData && !loading) {
      handleSynthesizeGraph();
    }
  }, [sessions.length]);

  // Toggle Micro-Habit Completion & Save to Firestore
  const handleToggleHabit = async (habitId: string) => {
    const updated = habits.map(h => {
      if (h.id === habitId) {
        return { ...h, completed: !h.completed };
      }
      return h;
    });

    setHabits(updated);

    try {
      const habitDocRef = doc(db, 'users', user.uid, 'settings', 'habits_tracker');
      await setDoc(habitDocRef, {
        habits: updated,
        streakDays: updated.every(h => h.completed) ? streakDays + 1 : streakDays,
        updatedAt: Date.now(),
      }, { merge: true });
    } catch (e) {
      console.error('Failed to sync habit state:', e);
    }
  };

  // Export Full Reflection Archive as Markdown
  const handleExportMarkdown = () => {
    let md = `# Sentinel OS // Personal Reflection & Cognitive Archive\n`;
    md += `**User:** ${user.displayName || user.email || 'Authenticated User'}\n`;
    md += `**Generated:** ${new Date().toISOString()}\n`;
    md += `**Total Reflections:** ${sessions.length}\n\n---\n\n`;

    if (graphData) {
      md += `## 🧠 Cognitive Trajectory & Growth Radar\n\n`;
      md += `${graphData.mindsetTrajectory}\n\n`;
      md += `### Metrics\n`;
      md += `- Cognitive Clarity: ${graphData.radarMetrics.cognitiveClarity}%\n`;
      md += `- Strategic Focus: ${graphData.radarMetrics.strategicFocus}%\n`;
      md += `- Energy Velocity: ${graphData.radarMetrics.energyVelocity}%\n`;
      md += `- Emotional Resilience: ${graphData.radarMetrics.emotionalResilience}%\n`;
      md += `- Execution Momentum: ${graphData.radarMetrics.executionMomentum}%\n\n`;
    }

    md += `## 📚 Journal Entries & Multi-Turn Transcripts\n\n`;
    sessions.forEach((s, idx) => {
      md += `### ${idx + 1}. ${s.title}\n`;
      md += `- **Date:** ${new Date(s.updatedAt).toLocaleString()}\n`;
      md += `- **Mood:** ${s.mood || 'focused'}\n`;
      if (s.summary) {
        md += `\n**Summary:**\n${s.summary}\n`;
      }
      md += `\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentinel-reflections-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'goal': return { bg: 'bg-[#238636]/20', border: 'border-[#3FB950]', text: 'text-[#3FB950]', fill: '#3FB950' };
      case 'challenge': return { bg: 'bg-[#F85149]/20', border: 'border-[#F85149]', text: 'text-[#F85149]', fill: '#F85149' };
      case 'insight': return { bg: 'bg-[#58A6FF]/20', border: 'border-[#58A6FF]', text: 'text-[#58A6FF]', fill: '#58A6FF' };
      case 'habit': return { bg: 'bg-[#A371F7]/20', border: 'border-[#A371F7]', text: 'text-[#A371F7]', fill: '#A371F7' };
      case 'decision': return { bg: 'bg-[#E3B341]/20', border: 'border-[#E3B341]', text: 'text-[#E3B341]', fill: '#E3B341' };
      default: return { bg: 'bg-[#30363D]', border: 'border-[#8B949E]', text: 'text-[#C9D1D9]', fill: '#8B949E' };
    }
  };

  const filteredNodes = graphData?.nodes.filter(n => 
    selectedCategory === 'all' || n.category === selectedCategory
  ) || [];

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#58A6FF] shadow-[0_0_8px_#58A6FF]" />
            <h2 className="text-base sm:text-lg font-bold text-[#F0F6FC] font-mono flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-[#58A6FF]" />
              Cognitive Mind-Map & Longitudinal Growth Radar
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#58A6FF]/20 border border-[#58A6FF]/40 text-[#58A6FF] font-bold">
              ORIGINAL ENHANCEMENT
            </span>
          </div>
          <p className="text-xs text-[#8B949E] leading-relaxed font-sans max-w-2xl">
            Synthesizes themes across all your Cloud Firestore reflections into an interactive semantic graph, continuous mindset metrics, and daily actionable habit loops.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="btn-resynthesize-graph"
            onClick={handleSynthesizeGraph}
            disabled={loading || sessions.length === 0}
            className="px-3 py-1.5 rounded bg-[#238636] hover:bg-[#2ea043] text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(35,134,54,0.3)] disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'ANALYZING...' : 'RE-SYNTHESIZE'}</span>
          </button>

          <button
            id="btn-export-markdown"
            onClick={handleExportMarkdown}
            className="px-3 py-1.5 rounded bg-[#21262D] hover:bg-[#30363D] text-[#C9D1D9] border border-[#30363D] font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Download full reflection archive as structured Markdown"
          >
            <Download className="w-3.5 h-3.5 text-[#58A6FF]" />
            <span>EXPORT ARCHIVE</span>
          </button>
        </div>
      </div>

      {/* Grid: Interactive Semantic Graph + Longitudinal Radar Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT / CENTER: Interactive Knowledge Node Graph */}
        <div className="lg:col-span-7 bg-[#161B22] border border-[#30363D] rounded-xl overflow-hidden shadow-xl flex flex-col">
          <div className="px-4 py-3 bg-[#21262D] border-b border-[#30363D] flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#C9D1D9] flex items-center gap-2">
              <Network className="w-4 h-4 text-[#58A6FF]" />
              Semantic Thought Network ({graphData?.nodes.length || 0} Nodes)
            </span>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {['all', 'goal', 'insight', 'challenge', 'habit', 'decision'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#58A6FF] text-black'
                      : 'bg-[#0D1117] text-[#8B949E] hover:text-[#C9D1D9] border border-[#30363D]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive SVG Mind-Map Canvas */}
          <div className="p-4 bg-[#0D1117] flex-1 flex flex-col min-h-[380px]">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-2 border-[#58A6FF] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-mono text-[#58A6FF]">Gemini 3.6 Flash is extracting semantic clusters...</span>
              </div>
            ) : graphData ? (
              <div className="space-y-4 flex-1 flex flex-col">
                {/* SVG Visual Node Mesh */}
                <div className="relative w-full h-64 bg-[#0A0C10] rounded-lg border border-[#30363D]/60 overflow-hidden flex items-center justify-center p-4">
                  <svg className="w-full h-full" viewBox="0 0 500 240">
                    {/* SVG Connector Lines */}
                    {graphData.edges.map((edge, idx) => {
                      const sourceNodeIdx = graphData.nodes.findIndex(n => n.id === edge.source);
                      const targetNodeIdx = graphData.nodes.findIndex(n => n.id === edge.target);
                      if (sourceNodeIdx === -1 || targetNodeIdx === -1) return null;

                      const x1 = 80 + (sourceNodeIdx % 3) * 160 + (sourceNodeIdx % 2) * 20;
                      const y1 = 50 + Math.floor(sourceNodeIdx / 3) * 120;
                      const x2 = 80 + (targetNodeIdx % 3) * 160 + (targetNodeIdx % 2) * 20;
                      const y2 = 50 + Math.floor(targetNodeIdx / 3) * 120;

                      return (
                        <g key={idx}>
                          <line
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="#30363D"
                            strokeWidth="1.5"
                            strokeDasharray={edge.relationship === 'blocks' ? '4,4' : 'none'}
                          />
                          <text
                            x={(x1 + x2) / 2}
                            y={(y1 + y2) / 2 - 4}
                            fill="#8B949E"
                            fontSize="8"
                            fontFamily="monospace"
                            textAnchor="middle"
                          >
                            {edge.relationship}
                          </text>
                        </g>
                      );
                    })}

                    {/* SVG Nodes */}
                    {graphData.nodes.map((node, idx) => {
                      const isSelected = selectedNode?.id === node.id;
                      const style = getCategoryColor(node.category);
                      const cx = 80 + (idx % 3) * 160 + (idx % 2) * 20;
                      const cy = 50 + Math.floor(idx / 3) * 120;

                      return (
                        <g
                          key={node.id}
                          className="cursor-pointer transition-transform hover:scale-110"
                          onClick={() => setSelectedNode(node)}
                        >
                          <circle
                            cx={cx}
                            cy={cy}
                            r={isSelected ? 22 : 18}
                            fill="#161B22"
                            stroke={style.fill}
                            strokeWidth={isSelected ? 3 : 1.5}
                          />
                          <circle
                            cx={cx}
                            cy={cy}
                            r={isSelected ? 8 : 6}
                            fill={style.fill}
                            opacity={0.8}
                          />
                          <text
                            x={cx}
                            y={cy + 30}
                            fill="#F0F6FC"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            {node.label.length > 18 ? node.label.substring(0, 16) + '..' : node.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Selected Node Deep-Dive Card */}
                {selectedNode && (
                  <div className="p-3.5 bg-[#161B22] border border-[#30363D] rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${getCategoryColor(selectedNode.category).bg} ${getCategoryColor(selectedNode.category).text} border ${getCategoryColor(selectedNode.category).border}`}>
                          {selectedNode.category}
                        </span>
                        <h4 className="text-xs font-bold text-[#F0F6FC]">{selectedNode.label}</h4>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#8B949E]">
                        <span>Impact Strength:</span>
                        <span className="text-[#3FB950] font-bold">{selectedNode.strength}%</span>
                      </div>
                    </div>

                    <p className="text-xs text-[#8B949E] leading-relaxed font-sans">
                      {selectedNode.description}
                    </p>

                    {onExplorePromptInChat && (
                      <div className="pt-2 border-t border-[#30363D] flex justify-end">
                        <button
                          onClick={() => onExplorePromptInChat(`Help me reflect deeply on my insights around "${selectedNode.label}". What are the core trade-offs and next high-leverage actions?`)}
                          className="text-[10px] font-mono text-[#58A6FF] hover:underline flex items-center gap-1"
                        >
                          <span>Explore in Gemini Chat</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-20 text-center text-[#8B949E] space-y-2">
                <BrainCircuit className="w-8 h-8 mx-auto opacity-40 text-[#58A6FF]" />
                <p className="text-xs font-mono">Create 1 or 2 journal entries to generate your semantic thought network.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Longitudinal Growth Radar & Metric Velocity */}
        <div className="lg:col-span-5 space-y-6 flex flex-col">
          {/* Radar Metrics Progress Matrix */}
          <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#C9D1D9] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#3FB950]" />
                Longitudinal Growth Radar
              </span>
              <span className="text-[10px] font-mono bg-[#238636]/20 text-[#3FB950] px-2 py-0.5 rounded font-bold border border-[#238636]/30">
                ACTIVE
              </span>
            </div>

            {graphData?.radarMetrics ? (
              <div className="space-y-3 font-mono">
                <div>
                  <div className="flex justify-between text-[11px] text-[#C9D1D9] mb-1">
                    <span>🎯 Cognitive Clarity</span>
                    <span className="font-bold text-[#58A6FF]">{graphData.radarMetrics.cognitiveClarity}%</span>
                  </div>
                  <div className="h-2 w-full bg-[#0D1117] rounded-full overflow-hidden border border-[#30363D]">
                    <div className="h-full bg-[#58A6FF] rounded-full transition-all duration-1000" style={{ width: `${graphData.radarMetrics.cognitiveClarity}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-[#C9D1D9] mb-1">
                    <span>⚡ Strategic Focus</span>
                    <span className="font-bold text-[#3FB950]">{graphData.radarMetrics.strategicFocus}%</span>
                  </div>
                  <div className="h-2 w-full bg-[#0D1117] rounded-full overflow-hidden border border-[#30363D]">
                    <div className="h-full bg-[#3FB950] rounded-full transition-all duration-1000" style={{ width: `${graphData.radarMetrics.strategicFocus}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-[#C9D1D9] mb-1">
                    <span>🔥 Energy Velocity</span>
                    <span className="font-bold text-[#FF7043]">{graphData.radarMetrics.energyVelocity}%</span>
                  </div>
                  <div className="h-2 w-full bg-[#0D1117] rounded-full overflow-hidden border border-[#30363D]">
                    <div className="h-full bg-[#FF7043] rounded-full transition-all duration-1000" style={{ width: `${graphData.radarMetrics.energyVelocity}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-[#C9D1D9] mb-1">
                    <span>🛡️ Emotional Resilience</span>
                    <span className="font-bold text-[#A371F7]">{graphData.radarMetrics.emotionalResilience}%</span>
                  </div>
                  <div className="h-2 w-full bg-[#0D1117] rounded-full overflow-hidden border border-[#30363D]">
                    <div className="h-full bg-[#A371F7] rounded-full transition-all duration-1000" style={{ width: `${graphData.radarMetrics.emotionalResilience}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-[#C9D1D9] mb-1">
                    <span>🚀 Execution Momentum</span>
                    <span className="font-bold text-[#E3B341]">{graphData.radarMetrics.executionMomentum}%</span>
                  </div>
                  <div className="h-2 w-full bg-[#0D1117] rounded-full overflow-hidden border border-[#30363D]">
                    <div className="h-full bg-[#E3B341] rounded-full transition-all duration-1000" style={{ width: `${graphData.radarMetrics.executionMomentum}%` }} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-[#8B949E] text-xs font-mono">
                Calculating longitudinal growth metrics...
              </div>
            )}

            {/* Mindset Trajectory Assessment */}
            {graphData?.mindsetTrajectory && (
              <div className="p-3 bg-[#0D1117] border border-[#30363D] rounded-lg space-y-1.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#8B949E] font-bold">
                  AI Mindset Trajectory Evaluation
                </div>
                <p className="text-xs text-[#C9D1D9] leading-relaxed font-sans">
                  {graphData.mindsetTrajectory}
                </p>
              </div>
            )}
          </div>

          {/* Socratic Breakthrough Card */}
          {graphData?.socraticInquiry && (
            <div className="bg-[#161B22] border border-[#58A6FF]/40 rounded-xl p-4 shadow-lg space-y-2 relative overflow-hidden">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#58A6FF]">
                <Compass className="w-4 h-4 text-[#58A6FF]" />
                <span>Today's Socratic Breakthrough Question</span>
              </div>
              <p className="text-xs text-[#F0F6FC] italic font-sans leading-relaxed">
                "{graphData.socraticInquiry}"
              </p>
              {onExplorePromptInChat && (
                <button
                  onClick={() => onExplorePromptInChat(graphData.socraticInquiry)}
                  className="text-[10px] font-mono text-[#58A6FF] hover:underline flex items-center gap-1 pt-1"
                >
                  <span>Answer in Journal Session</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM: Daily Micro-Habits & Strategic Commitments (Persisted in Firestore) */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#3FB950]" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#C9D1D9]">
              Daily Micro-Habits & Action Commitments (Firestore Synced)
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="flex items-center gap-1 text-[#FF7043] font-bold">
              <Flame className="w-3.5 h-3.5" />
              {streakDays}-Day Momentum Streak
            </span>
            <span className="text-[#8B949E]">•</span>
            <span className="text-[#3FB950] font-bold">
              {habits.filter(h => h.completed).length}/{habits.length} Done Today
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {habits.length === 0 ? (
            <div className="col-span-3 py-6 text-center text-[#8B949E] text-xs font-mono">
              Generating your tailored micro-habits from journal reflection themes...
            </div>
          ) : (
            habits.map((habit) => (
              <div
                key={habit.id}
                onClick={() => handleToggleHabit(habit.id)}
                className={`p-3.5 rounded-lg border transition-all cursor-pointer space-y-2 flex flex-col justify-between ${
                  habit.completed
                    ? 'bg-[#238636]/10 border-[#3FB950]/60'
                    : 'bg-[#0D1117] border-[#30363D] hover:border-[#484F58]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-xs font-bold ${habit.completed ? 'text-[#3FB950] line-through' : 'text-[#F0F6FC]'}`}>
                      {habit.title}
                    </span>
                    <div className="shrink-0 pt-0.5">
                      {habit.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-[#3FB950]" />
                      ) : (
                        <Circle className="w-4 h-4 text-[#8B949E]" />
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-[#8B949E] font-mono">
                    <strong className="text-[#C9D1D9]">Trigger:</strong> {habit.trigger}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#30363D]/50 flex items-center justify-between text-[10px] font-mono text-[#8B949E]">
                  <span className="text-[#A371F7] font-semibold">{habit.frequency}</span>
                  <span>{habit.completed ? 'Completed' : 'Tap to mark complete'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
