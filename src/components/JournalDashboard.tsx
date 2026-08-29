import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Send, 
  Sparkles, 
  BookOpen, 
  Calendar, 
  Clock, 
  Tag, 
  Smile, 
  RefreshCw, 
  Bot, 
  User as UserIcon, 
  FileText, 
  Lightbulb, 
  Search, 
  ChevronRight, 
  Check, 
  Copy, 
  AlertTriangle,
  Flame,
  ShieldCheck,
  Zap,
  HelpCircle,
  Hash,
  Download,
  BrainCircuit,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Layers
} from 'lucide-react';
import { 
  db, 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  updateDoc, 
  setDoc,
  serverTimestamp, 
  type User 
} from '../lib/firebase';
import { JournalSession, JournalMessage } from '../types';
import { CognitiveMindMap } from './CognitiveMindMap';
import { SentimentTrends } from './SentimentTrends';

interface JournalDashboardProps {
  user: User;
  onTransactionLogged?: () => void;
}

const MOODS = [
  { label: '🎯 Focused', value: 'focused' },
  { label: '🌿 Calm', value: 'calm' },
  { label: '💡 Inspired', value: 'inspired' },
  { label: '⚡ Energized', value: 'energized' },
  { label: '🤔 Contemplative', value: 'contemplative' },
  { label: '🧗 Challenged', value: 'challenged' },
];

const PROMPT_SUGGESTIONS = [
  "What is the most meaningful insight or win from today, and why?",
  "I am facing a complex technical problem. Help me break it down into first principles.",
  "Reflect on my decision-making process for our architecture migration.",
  "Brainstorm 3 creative solutions to improve our deployment velocity.",
];

export const JournalDashboard: React.FC<JournalDashboardProps> = ({ user, onTransactionLogged }) => {
  const [dashboardView, setDashboardView] = useState<'chat' | 'mindmap' | 'sentiment'>('chat');
  const [sessions, setSessions] = useState<JournalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<JournalMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState('focused');
  const [journalTitle, setJournalTitle] = useState('New Reflection Entry');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeSummary, setActiveSummary] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Speech Recognition (Voice Dictation) Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputText((prev) => prev + (prev ? ' ' : '') + transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      setStatusMessage('Speech-to-Text is not supported in this browser environment.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        setStatusMessage('Listening to your voice dictation...');
      } catch (e) {
        console.error('Failed to start speech recognition:', e);
      }
    }
  };

  // Text-to-Speech (Audio Mindful Readback)
  const handleReadAloud = (text: string, msgId: string) => {
    if (!('speechSynthesis' in window)) {
      setStatusMessage('Text-to-speech audio synthesis is not supported on this browser.');
      return;
    }

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_`]/g, ''));
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(msgId);
    window.speechSynthesis.speak(utterance);
  };


  // 1. Subscribe to User's Isolated Journals in Cloud Firestore & Ensure Root User Doc Exists
  useEffect(() => {
    if (!user || !user.uid) return;

    // Ensure root user document exists so it is directly visible in Firestore Console queries
    const userDocRef = doc(db, 'users', user.uid);
    setDoc(userDocRef, {
      uid: user.uid,
      email: user.email || 'guest@productiondirectives.local',
      displayName: user.displayName || 'Guest Reflection Author',
      lastActive: Date.now(),
      updatedAt: Date.now(),
    }, { merge: true }).catch((err) => {
      console.warn('User root doc sync note:', err);
    });

    const journalsRef = collection(db, 'users', user.uid, 'journals');
    const q = query(journalsRef, orderBy('updatedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedSessions: JournalSession[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        loadedSessions.push({
          id: docSnap.id,
          userId: user.uid,
          title: data.title || 'Untitled Reflection',
          summary: data.summary,
          tags: data.tags || [],
          mood: data.mood || 'focused',
          createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt || Date.now()),
          updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (data.updatedAt || Date.now()),
          messageCount: data.messageCount || 0,
          lastMessageSnippet: data.lastMessageSnippet || '',
        });
      });

      setSessions(loadedSessions);

      // Select first session if none selected
      if (loadedSessions.length > 0 && !activeSessionId) {
        setActiveSessionId(loadedSessions[0].id);
        setJournalTitle(loadedSessions[0].title);
        setSelectedMood(loadedSessions[0].mood || 'focused');
        setActiveSummary(loadedSessions[0].summary || null);
      }
    }, (error) => {
      console.error('Firestore journals onSnapshot error:', error);
      setStatusMessage('Firestore sync error: ' + error.message);
    });

    return () => unsubscribe();
  }, [user.uid]);

  // 2. Subscribe to Messages of the Active Journal Session
  useEffect(() => {
    if (!user || !user.uid || !activeSessionId) {
      setMessages([]);
      return;
    }

    const currentSession = sessions.find(s => s.id === activeSessionId);
    if (currentSession) {
      setJournalTitle(currentSession.title);
      setSelectedMood(currentSession.mood || 'focused');
      setActiveSummary(currentSession.summary || null);
    }

    const messagesRef = collection(db, 'users', user.uid, 'journals', activeSessionId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages: JournalMessage[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        loadedMessages.push({
          id: docSnap.id,
          role: data.role,
          content: data.content,
          timestamp: data.timestamp || new Date().toISOString(),
          modelUsed: data.modelUsed,
          fallbackTrace: data.fallbackTrace,
        });
      });
      setMessages(loadedMessages);
      scrollToBottom();
    }, (error) => {
      console.error('Firestore messages onSnapshot error:', error);
    });

    return () => unsubscribe();
  }, [activeSessionId, user.uid]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // 3. Create a New Journal Entry in Firestore
  const handleCreateNewJournal = async () => {
    try {
      const newTitle = `Reflection on ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
      const journalsRef = collection(db, 'users', user.uid, 'journals');
      
      const docRef = await addDoc(journalsRef, {
        userId: user.uid,
        title: newTitle,
        mood: 'focused',
        tags: ['reflection'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount: 0,
        lastMessageSnippet: 'Drafted entry...',
      });

      setActiveSessionId(docRef.id);
      setJournalTitle(newTitle);
      setSelectedMood('focused');
      setActiveSummary(null);
      setMessages([]);
      setStatusMessage('Created new reflection session in Cloud Firestore.');
    } catch (err: any) {
      console.error('Failed to create journal:', err);
      setStatusMessage('Error creating journal: ' + err.message);
    }
  };

  // 4. Update Journal Metadata in Firestore
  const handleUpdateTitle = async (newTitle: string) => {
    setJournalTitle(newTitle);
    if (!activeSessionId) return;
    try {
      const journalDocRef = doc(db, 'users', user.uid, 'journals', activeSessionId);
      await updateDoc(journalDocRef, {
        title: newTitle,
        updatedAt: Date.now(),
      });
    } catch (e) {
      console.error('Failed to update title:', e);
    }
  };

  const handleUpdateMood = async (newMood: string) => {
    setSelectedMood(newMood);
    if (!activeSessionId) return;
    try {
      const journalDocRef = doc(db, 'users', user.uid, 'journals', activeSessionId);
      await updateDoc(journalDocRef, {
        mood: newMood,
        updatedAt: Date.now(),
      });
    } catch (e) {
      console.error('Failed to update mood:', e);
    }
  };

  // 5. Delete Journal Session from Firestore
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this journal reflection? This cannot be undone.')) return;

    try {
      const journalDocRef = doc(db, 'users', user.uid, 'journals', sessionId);
      await deleteDoc(journalDocRef);
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
      }
      setStatusMessage('Journal reflection deleted from Firestore.');
    } catch (err: any) {
      console.error('Failed to delete session:', err);
      setStatusMessage('Error deleting: ' + err.message);
    }
  };

  // 6. Send User Prompt & Multi-Turn Converse with Gemini 3.6 Flash
  const handleSendMessage = async (customPrompt?: string, mode: 'reflect' | 'brainstorm' | 'summarize' = 'reflect') => {
    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() || loadingAI) return;

    let targetSessionId = activeSessionId;

    // Auto-create session if none active
    if (!targetSessionId) {
      try {
        const newTitle = textToSend.length > 40 ? textToSend.substring(0, 40) + '...' : textToSend;
        const journalsRef = collection(db, 'users', user.uid, 'journals');
        const docRef = await addDoc(journalsRef, {
          userId: user.uid,
          title: newTitle,
          mood: selectedMood,
          tags: ['reflection'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messageCount: 0,
          lastMessageSnippet: textToSend.substring(0, 80),
        });
        targetSessionId = docRef.id;
        setActiveSessionId(targetSessionId);
      } catch (err: any) {
        console.error('Failed to auto-create session:', err);
        return;
      }
    }

    if (!customPrompt) setInputText('');
    setLoadingAI(true);
    setStatusMessage('Communicating with Gemini 3.6 Flash...');

    const userMessageObj: JournalMessage = {
      id: 'usr-' + Date.now(),
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toISOString(),
    };

    // Optimistically update & persist user message to Firestore
    try {
      const messagesRef = collection(db, 'users', user.uid, 'journals', targetSessionId, 'messages');
      await addDoc(messagesRef, {
        role: 'user',
        content: userMessageObj.content,
        timestamp: userMessageObj.timestamp,
      });

      // Update parent journal document
      const journalDocRef = doc(db, 'users', user.uid, 'journals', targetSessionId);
      await updateDoc(journalDocRef, {
        updatedAt: Date.now(),
        lastMessageSnippet: userMessageObj.content.substring(0, 80),
        messageCount: messages.length + 1,
      });
    } catch (e: any) {
      console.warn('Firestore write warning:', e);
    }

    // Call server-side Gemini 3.6 Flash API
    try {
      const transcriptForAI = [...messages, userMessageObj].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/journal/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: transcriptForAI,
          journalTitle: journalTitle || 'Journal Reflection',
          mode,
        }),
      });

      const data = await res.json();
      if (data.success && data.text) {
        const modelMessageObj: JournalMessage = {
          id: 'ai-' + Date.now(),
          role: 'model',
          content: data.text,
          timestamp: new Date().toISOString(),
          modelUsed: data.modelUsed,
          fallbackTrace: data.fallbackTrace,
        };

        // Persist AI response in Firestore
        const messagesRef = collection(db, 'users', user.uid, 'journals', targetSessionId, 'messages');
        await addDoc(messagesRef, {
          role: 'model',
          content: modelMessageObj.content,
          timestamp: modelMessageObj.timestamp,
          modelUsed: data.modelUsed,
          fallbackTrace: data.fallbackTrace || [],
        });

        // Update parent session messageCount
        const journalDocRef = doc(db, 'users', user.uid, 'journals', targetSessionId);
        await updateDoc(journalDocRef, {
          updatedAt: Date.now(),
          messageCount: messages.length + 2,
        });

        if (onTransactionLogged) onTransactionLogged();
        setStatusMessage(`Received reflection from ${data.modelUsed || 'Gemini 3.6 Flash'} (${data.latencyMs || 0}ms)`);
      } else {
        setStatusMessage('AI Error: ' + (data.error || 'Failed to generate response'));
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setStatusMessage('Network / server error: ' + err.message);
    } finally {
      setLoadingAI(false);
      scrollToBottom();
    }
  };

  // 7. Instant Summarization & Key Takeaways Generator
  const handleGenerateSummary = async () => {
    if (!activeSessionId || messages.length === 0 || summarizing) return;

    setSummarizing(true);
    setStatusMessage('Synthesizing session insights with Gemini 3.6 Flash...');

    try {
      const res = await fetch('/api/journal/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: messages,
          journalTitle,
        }),
      });

      const data = await res.json();
      if (data.success && data.summary) {
        setActiveSummary(data.summary);

        // Update Firestore journal document with AI summary
        const journalDocRef = doc(db, 'users', user.uid, 'journals', activeSessionId);
        await updateDoc(journalDocRef, {
          summary: data.summary,
          updatedAt: Date.now(),
        });

        setStatusMessage('Summary & key insights saved to Cloud Firestore.');
      } else {
        setStatusMessage('Summarization failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      console.error('Summarize error:', err);
      setStatusMessage('Error: ' + err.message);
    } finally {
      setSummarizing(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.summary && s.summary.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* View Switcher: Interactive Studio vs Cognitive Mind-Map vs Sentiment Trends */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#161B22] border border-[#30363D] rounded-xl p-2 px-3 shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="tab-view-chat"
            onClick={() => setDashboardView('chat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              dashboardView === 'chat'
                ? 'bg-[#21262D] text-[#F0F6FC] border border-[#30363D] shadow-sm'
                : 'text-[#8B949E] hover:text-[#C9D1D9]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#58A6FF]" />
            <span>Reflection Canvas & Chat</span>
          </button>

          <button
            id="tab-view-mindmap"
            onClick={() => setDashboardView('mindmap')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              dashboardView === 'mindmap'
                ? 'bg-[#21262D] text-[#58A6FF] border border-[#58A6FF]/40 shadow-sm'
                : 'text-[#8B949E] hover:text-[#58A6FF]'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5 text-[#58A6FF]" />
            <span>🧠 Cognitive Mind-Map</span>
          </button>

          <button
            id="tab-view-sentiment"
            onClick={() => setDashboardView('sentiment')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              dashboardView === 'sentiment'
                ? 'bg-[#21262D] text-[#3FB950] border border-[#238636]/40 shadow-sm'
                : 'text-[#8B949E] hover:text-[#3FB950]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#3FB950]" />
            <span>📈 Sentiment & Emotional Trends</span>
            <span className="text-[9px] bg-[#238636]/20 text-[#3FB950] px-1.5 py-0.2 rounded border border-[#238636]/30">
              AI RADAR
            </span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-3 text-[10px] font-mono text-[#8B949E]">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#3FB950]" />
            Owner-Isolated Firestore
          </span>
        </div>
      </div>

      {dashboardView === 'mindmap' ? (
        <CognitiveMindMap
          user={user}
          sessions={sessions}
          onOpenJournalSession={(id) => {
            setActiveSessionId(id);
            setDashboardView('chat');
          }}
          onExplorePromptInChat={(prompt) => {
            setInputText(prompt);
            setDashboardView('chat');
          }}
        />
      ) : dashboardView === 'sentiment' ? (
        <SentimentTrends
          user={user}
          sessions={sessions}
          onOpenJournalSession={(id) => {
            setActiveSessionId(id);
            setDashboardView('chat');
          }}
          onExplorePromptInChat={(prompt) => {
            setInputText(prompt);
            setDashboardView('chat');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* LEFT COLUMN: User Profile & Historical Journal Sessions Sidebar */}
          <div className="lg:col-span-4 space-y-4 flex flex-col">
            {/* User Identity & Firestore Isolation Badge */}
            <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-4 space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'User'} 
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full border border-[#58A6FF]"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#58A6FF]/20 border border-[#58A6FF]/40 text-[#58A6FF] flex items-center justify-center font-bold text-xs">
                      {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-[#F0F6FC] truncate max-w-[160px]">
                      {user.displayName || user.email || 'Authenticated User'}
                    </div>
                    <div className="text-[10px] text-[#8B949E] font-mono truncate max-w-[170px]">
                      {user.isAnonymous ? 'Sandbox Guest Account' : user.email}
                    </div>
                  </div>
                </div>

                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#238636]/20 border border-[#238636]/40 text-[#3FB950] font-bold">
                  AUTH ACTIVE
                </span>
              </div>

              <div className="pt-2 border-t border-[#30363D] flex items-center justify-between text-[10px] font-mono text-[#8B949E]">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#3FB950]" />
                  Isolated: <code className="text-[#58A6FF] text-[9px]">/users/{user.uid.substring(0, 8)}...</code>
                </span>
                <span className="text-[#C9D1D9] font-bold">{sessions.length} Saved</span>
              </div>
            </div>

            {/* Journal Entries List & Navigation */}
            <div className="bg-[#161B22] border border-[#30363D] rounded-lg overflow-hidden flex flex-col flex-1 shadow-md min-h-[450px]">
              <div className="px-4 py-3 bg-[#21262D] border-b border-[#30363D] flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9D1D9] font-mono flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-[#58A6FF]" />
                  Reflection History
                </span>

                <button
                  id="btn-new-journal-entry"
                  onClick={handleCreateNewJournal}
                  className="px-2.5 py-1 rounded bg-[#238636] hover:bg-[#2ea043] text-white font-mono text-[10px] font-bold flex items-center gap-1 transition-all shadow-[0_0_8px_rgba(35,134,54,0.3)] cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>NEW REFLECTION</span>
                </button>
              </div>

              {/* Search Filter */}
              <div className="p-3 border-b border-[#30363D]">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#8B949E] absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search reflections & insights..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0D1117] border border-[#30363D] rounded pl-8 pr-3 py-1.5 text-xs text-[#C9D1D9] font-mono placeholder:text-[#484F58] focus:outline-none focus:border-[#58A6FF]"
                  />
                </div>
              </div>

              {/* Session Cards */}
              <div className="p-2 space-y-1.5 overflow-y-auto max-h-[500px] flex-1">
                {filteredSessions.length === 0 ? (
                  <div className="py-12 text-center text-[#484F58] text-xs font-mono space-y-2">
                    <FileText className="w-8 h-8 mx-auto opacity-40 text-[#58A6FF]" />
                    <p>No journal reflections found.</p>
                    <button
                      onClick={handleCreateNewJournal}
                      className="text-[#58A6FF] text-[11px] hover:underline cursor-pointer"
                    >
                      Click here to create your first entry
                    </button>
                  </div>
                ) : (
                  filteredSessions.map((session) => {
                    const isActive = session.id === activeSessionId;
                    return (
                      <div
                        key={session.id}
                        onClick={() => setActiveSessionId(session.id)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer space-y-1.5 ${
                          isActive
                            ? 'bg-[#21262D] border-[#58A6FF] shadow-sm'
                            : 'bg-[#0D1117] border-[#30363D] hover:border-[#484F58]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <div className="text-xs font-bold text-[#F0F6FC] truncate">
                              {session.title}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-[#8B949E]">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(session.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                              <span>•</span>
                              <span className="text-[#58A6FF] font-semibold">
                                {session.messageCount} msg{session.messageCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => handleDeleteSession(session.id, e)}
                            className="p-1 rounded hover:bg-[#F85149]/20 text-[#8B949E] hover:text-[#F85149] transition-all"
                            title="Delete this reflection"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {session.lastMessageSnippet && (
                          <p className="text-[11px] text-[#8B949E] font-mono truncate">
                            {session.lastMessageSnippet}
                          </p>
                        )}

                        {session.summary && (
                          <div className="text-[9px] font-mono text-[#3FB950] bg-[#238636]/10 px-2 py-0.5 rounded border border-[#238636]/30 truncate flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 shrink-0" />
                            <span>AI Summarized</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Active Journal Entry, Multi-Turn Reflection & Gemini Partner */}
          <div className="lg:col-span-8 space-y-4 flex flex-col">
            <div className="bg-[#161B22] border border-[#30363D] rounded-lg overflow-hidden flex flex-col flex-1 shadow-2xl">
              {/* Active Entry Header Bar */}
              <div className="px-4 py-3 bg-[#21262D] border-b border-[#30363D] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={journalTitle}
                      onChange={(e) => handleUpdateTitle(e.target.value)}
                      placeholder="Journal Entry Title..."
                      className="w-full bg-transparent text-sm sm:text-base font-bold text-[#F0F6FC] focus:outline-none border-b border-transparent focus:border-[#58A6FF] transition-all"
                    />
                  </div>

                  {/* Mood Selector & Summary Action */}
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={selectedMood}
                      onChange={(e) => handleUpdateMood(e.target.value)}
                      className="bg-[#0D1117] border border-[#30363D] rounded px-2.5 py-1 text-xs text-[#C9D1D9] font-mono focus:outline-none focus:border-[#58A6FF]"
                    >
                      {MOODS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>

                    <button
                      id="btn-summarize-session"
                      onClick={handleGenerateSummary}
                      disabled={summarizing || messages.length === 0}
                      className="px-2.5 py-1 rounded bg-[#21262D] hover:bg-[#30363D] text-[#58A6FF] border border-[#30363D] text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
                      title="Generate structured summary, key takeaways, and action items"
                    >
                      {summarizing ? (
                        <RefreshCw className="w-3 h-3 animate-spin text-[#58A6FF]" />
                      ) : (
                        <Sparkles className="w-3 h-3 text-[#58A6FF]" />
                      )}
                      <span>{summarizing ? 'SUMMARIZING...' : 'SUMMARIZE'}</span>
                    </button>
                  </div>
                </div>

                {/* Quick Inspiration Prompts */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <span className="text-[10px] font-mono text-[#8B949E] uppercase tracking-wider shrink-0 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3 text-[#E3B341]" />
                    Inspiration:
                  </span>
                  {PROMPT_SUGGESTIONS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt, 'reflect')}
                      disabled={loadingAI}
                      className="text-[10px] font-mono bg-[#0D1117] hover:bg-[#30363D] text-[#C9D1D9] px-2.5 py-0.5 rounded border border-[#30363D] whitespace-nowrap transition-all shrink-0 cursor-pointer disabled:opacity-40"
                    >
                      {prompt.length > 35 ? prompt.substring(0, 35) + '...' : prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Executive Summary Card (if generated) */}
              {activeSummary && (
                <div className="p-4 bg-[#0D1117] border-b border-[#30363D] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#3FB950] font-mono">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Gemini 3.6 Flash Session Synthesis & Key Takeaways</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(activeSummary, 'summary')}
                      className="text-[10px] font-mono text-[#8B949E] hover:text-[#C9D1D9] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === 'summary' ? <Check className="w-3 h-3 text-[#3FB950]" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === 'summary' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="text-xs text-[#C9D1D9] leading-relaxed whitespace-pre-wrap font-sans bg-[#161B22] p-3 rounded border border-[#30363D]">
                    {activeSummary}
                  </div>
                </div>
              )}

              {/* Conversation Transcript & Entries */}
              <div className="p-4 space-y-4 overflow-y-auto min-h-[380px] max-h-[500px] flex-1 bg-[#0A0C10]/40">
                {messages.length === 0 ? (
                  <div className="py-16 text-center text-[#8B949E] space-y-3">
                    <div className="w-12 h-12 rounded-full bg-[#161B22] border border-[#30363D] flex items-center justify-center mx-auto text-[#58A6FF]">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="space-y-1 max-w-md mx-auto">
                      <h4 className="text-sm font-bold text-[#F0F6FC]">Your Private Reflection Canvas</h4>
                      <p className="text-xs text-[#8B949E] leading-relaxed">
                        Write down your thoughts, reflections, or engineering challenges below. Gemini 3.6 Flash will converse, suggest brainstorming angles, and extract takeaways.
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isUser = msg.role === 'user';
                    const isSpeaking = speakingMessageId === msg.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        {/* Avatar */}
                        {isUser ? (
                          <div className="w-8 h-8 rounded-full bg-[#238636]/20 border border-[#238636]/40 text-[#3FB950] flex items-center justify-center shrink-0 font-bold text-xs">
                            <UserIcon className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#58A6FF]/20 border border-[#58A6FF]/40 text-[#58A6FF] flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4" />
                          </div>
                        )}

                        {/* Bubble */}
                        <div
                          className={`max-w-[85%] rounded-lg p-3.5 space-y-1.5 shadow-sm ${
                            isUser
                              ? 'bg-[#1F6FEB]/20 border border-[#1F6FEB]/40 text-[#F0F6FC]'
                              : 'bg-[#161B22] border border-[#30363D] text-[#C9D1D9]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4 text-[10px] font-mono text-[#8B949E]">
                            <span className="font-bold uppercase tracking-wider text-[#C9D1D9]">
                              {isUser ? 'You (Journal Entry)' : (msg.modelUsed || 'Gemini 3.6 Flash')}
                            </span>
                            <div className="flex items-center gap-2">
                              <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {!isUser && (
                                <button
                                  onClick={() => handleReadAloud(msg.content, msg.id)}
                                  className={`p-1 rounded transition-all cursor-pointer ${
                                    isSpeaking ? 'text-[#58A6FF] bg-[#58A6FF]/20' : 'text-[#8B949E] hover:text-[#C9D1D9]'
                                  }`}
                                  title={isSpeaking ? 'Stop audio readback' : 'Listen to mindful reflection readback'}
                                >
                                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5 animate-pulse" /> : <Volume2 className="w-3.5 h-3.5" />}
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="text-xs leading-relaxed whitespace-pre-wrap font-sans">
                            {msg.content}
                          </div>

                          {!isUser && (
                            <div className="pt-1.5 border-t border-[#30363D]/60 flex items-center justify-between text-[10px] font-mono text-[#8B949E]">
                              <span className="flex items-center gap-1 text-[#3FB950]">
                                <ShieldCheck className="w-3 h-3" /> Saved in Firestore
                              </span>
                              <button
                                onClick={() => copyToClipboard(msg.content, msg.id)}
                                className="hover:text-[#C9D1D9] flex items-center gap-1 transition-all cursor-pointer"
                              >
                                {copiedId === msg.id ? <Check className="w-3 h-3 text-[#3FB950]" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {loadingAI && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#58A6FF]/20 border border-[#58A6FF]/40 text-[#58A6FF] flex items-center justify-center shrink-0 animate-pulse">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-3 space-y-2 max-w-sm">
                      <div className="flex items-center gap-2 text-xs font-mono text-[#58A6FF]">
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                        <span>Gemini 3.6 Flash is reflecting...</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#21262D] rounded-full overflow-hidden">
                        <div className="h-full bg-[#58A6FF] w-2/3 animate-pulse rounded-full" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Status Bar */}
              {statusMessage && (
                <div className="px-4 py-1.5 bg-[#0D1117] border-t border-[#30363D] text-[10px] font-mono text-[#8B949E] flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[#58A6FF]">
                    <Flame className="w-3 h-3" />
                    {statusMessage}
                  </span>
                  <span className="text-[#484F58]">Cloud Run + Firestore Active</span>
                </div>
              )}

              {/* Message Input & Action Controls */}
              <div className="p-3 bg-[#161B22] border-t border-[#30363D] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      id="btn-brainstorm-mode"
                      onClick={() => handleSendMessage(undefined, 'brainstorm')}
                      disabled={loadingAI || !inputText.trim()}
                      className="px-2 py-0.5 rounded bg-[#0D1117] hover:bg-[#30363D] text-[#E3B341] border border-[#30363D] text-[10px] font-mono flex items-center gap-1 transition-all disabled:opacity-40 cursor-pointer"
                      title="Prompt Gemini to generate creative brainstorming ideas and alternative angles"
                    >
                      <Lightbulb className="w-3 h-3" />
                      <span>Brainstorm Ideas</span>
                    </button>

                    <button
                      id="btn-socratic-mode"
                      onClick={() => handleSendMessage(undefined, 'reflect')}
                      disabled={loadingAI || !inputText.trim()}
                      className="px-2 py-0.5 rounded bg-[#0D1117] hover:bg-[#30363D] text-[#58A6FF] border border-[#30363D] text-[10px] font-mono flex items-center gap-1 transition-all disabled:opacity-40 cursor-pointer"
                      title="Prompt Gemini for deep reflective feedback and inquiry"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Deep Reflection</span>
                    </button>
                  </div>

                  <span className="text-[10px] font-mono text-[#8B949E] hidden sm:inline">
                    Press <kbd className="px-1 py-0.2 bg-[#0D1117] border border-[#30363D] rounded text-[#C9D1D9]">Enter</kbd> or <kbd className="px-1 py-0.2 bg-[#0D1117] border border-[#30363D] rounded text-[#C9D1D9]">Cmd+Enter</kbd>
                  </span>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <textarea
                      id="input-journal-message"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Write your journal reflection, thoughts, or questions for Gemini..."
                      rows={3}
                      disabled={loadingAI}
                      className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg p-3 pr-10 text-xs text-[#F0F6FC] font-sans placeholder:text-[#484F58] focus:outline-none focus:border-[#58A6FF] resize-none"
                    />

                    {/* Speech Dictation Mic Button */}
                    <button
                      id="btn-voice-dictation"
                      type="button"
                      onClick={toggleVoiceRecording}
                      className={`absolute right-2.5 bottom-2.5 p-1.5 rounded-full transition-all cursor-pointer ${
                        isRecording
                          ? 'bg-[#F85149] text-white shadow-[0_0_10px_#F85149] animate-pulse'
                          : 'bg-[#21262D] text-[#8B949E] hover:text-[#C9D1D9] hover:bg-[#30363D]'
                      }`}
                      title={isRecording ? 'Stop voice recording' : 'Dictate reflection using voice'}
                    >
                      {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <button
                    id="btn-send-journal-message"
                    onClick={() => handleSendMessage()}
                    disabled={loadingAI || !inputText.trim()}
                    className="px-4 bg-[#238636] hover:bg-[#2ea043] text-white font-mono text-xs font-bold rounded-lg flex flex-col items-center justify-center gap-1 transition-all shadow-[0_0_10px_rgba(35,134,54,0.3)] disabled:opacity-40 cursor-pointer shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span className="text-[10px]">SEND</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
