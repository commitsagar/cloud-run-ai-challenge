import React, { useState, useEffect, useId } from 'react';
import {
  TrendingUp,
  Heart,
  Sparkles,
  RefreshCw,
  Zap,
  ShieldCheck,
  Calendar,
  ChevronRight,
  Flame,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  Smile,
  Frown,
  Activity,
  Award,
  AlertCircle
} from 'lucide-react';
import { User } from 'firebase/auth';
import { JournalSession, SentimentAnalysisData, SentimentTrendPoint } from '../types';

interface SentimentTrendsProps {
  user: User;
  sessions: JournalSession[];
  onOpenJournalSession: (sessionId: string) => void;
  onExplorePromptInChat: (prompt: string) => void;
}

export const SentimentTrends: React.FC<SentimentTrendsProps> = ({
  user,
  sessions,
  onOpenJournalSession,
  onExplorePromptInChat,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [sentimentData, setSentimentData] = useState<SentimentAnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<SentimentTrendPoint | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<SentimentTrendPoint | null>(null);
  const [filterRange, setFilterRange] = useState<'all' | '30d' | '7d'>('all');
  const gradientId = useId();

  const fetchSentimentAnalysis = async () => {
    if (!sessions || sessions.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      // Sort sessions chronologically ascending
      const chronological = [...sessions].sort((a, b) => (a.updatedAt || 0) - (b.updatedAt || 0));

      const res = await fetch('/api/journal/sentiment-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          sessions: chronological.slice(-20), // Analyze up to last 20 sessions
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setSentimentData(json.data);
        if (json.data.trendPoints && json.data.trendPoints.length > 0) {
          setSelectedPoint(json.data.trendPoints[json.data.trendPoints.length - 1]);
        }
      } else {
        setError(json.error || 'Failed to analyze emotional sentiment trends.');
      }
    } catch (err: any) {
      console.error('Sentiment fetch error:', err);
      setError(err.message || 'Network error fetching sentiment data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSentimentAnalysis();
  }, [sessions.length]);

  if (sessions.length === 0) {
    return (
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-8 text-center space-y-4 shadow-lg">
        <div className="w-12 h-12 rounded-full bg-[#58A6FF]/10 border border-[#58A6FF]/30 flex items-center justify-center mx-auto text-[#58A6FF]">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <h3 className="text-base font-bold text-[#F0F6FC]">No Journal Entries to Analyze</h3>
          <p className="text-xs text-[#8B949E] leading-relaxed">
            Record reflections in your Journal Canvas first. Gemini will automatically analyze affective sentiment, detect emotional inflection points, and chart your wellness trajectory.
          </p>
        </div>
      </div>
    );
  }

  // Filter trend points based on selected range
  const filteredTrendPoints = (sentimentData?.trendPoints || []).filter((pt) => {
    if (filterRange === 'all') return true;
    const now = Date.now();
    const cutoffDays = filterRange === '7d' ? 7 : 30;
    const cutoff = now - cutoffDays * 24 * 60 * 60 * 1000;
    return pt.timestamp >= cutoff;
  });

  // Calculate SVG Chart coordinates
  const svgWidth = 720;
  const svgHeight = 240;
  const paddingX = 40;
  const paddingY = 30;
  const graphWidth = svgWidth - paddingX * 2;
  const graphHeight = svgHeight - paddingY * 2;

  const pointsCount = filteredTrendPoints.length;
  const chartCoordinates = filteredTrendPoints.map((pt, idx) => {
    const x = pointsCount > 1 
      ? paddingX + (idx / (pointsCount - 1)) * graphWidth 
      : svgWidth / 2;
    // sentimentScore ranges 0 to 100
    const clampedScore = Math.max(10, Math.min(100, pt.sentimentScore));
    const y = paddingY + graphHeight - ((clampedScore - 10) / 90) * graphHeight;
    return { ...pt, x, y };
  });

  // Generate SVG path for line and area
  const linePath = chartCoordinates.reduce((acc, curr, idx) => {
    if (idx === 0) return `M ${curr.x} ${curr.y}`;
    // Catmull-Rom or cubic Bezier for organic smoothing
    const prev = chartCoordinates[idx - 1];
    const cp1x = prev.x + (curr.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (curr.x - prev.x) / 2;
    const cp2y = curr.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
  }, '');

  const areaPath = chartCoordinates.length > 0 
    ? `${linePath} L ${chartCoordinates[chartCoordinates.length - 1].x} ${svgHeight - paddingY} L ${chartCoordinates[0].x} ${svgHeight - paddingY} Z`
    : '';

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#58A6FF]/20 text-[#58A6FF] border border-[#58A6FF]/30">
                <TrendingUp className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-[#F0F6FC] font-sans">
                Emotional Trajectory & Sentiment Radar
              </h2>
            </div>
            <p className="text-xs text-[#8B949E]">
              Gemini evaluates longitudinal affective sentiment, emotional volatility, and burnout resilience across your entries.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-refresh-sentiment"
              onClick={fetchSentimentAnalysis}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-[#21262D] hover:bg-[#30363D] text-[#58A6FF] border border-[#30363D] text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'ANALYZING...' : 'RE-ANALYZE TRENDS'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-[#F85149]/10 border border-[#F85149]/30 rounded-lg text-xs font-mono text-[#F85149] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Executive Sentiment KPI Row */}
        {sentimentData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-[#0D1117] border border-[#30363D] rounded-lg p-3.5 space-y-1">
              <div className="text-[10px] font-mono text-[#8B949E] uppercase tracking-wider flex items-center justify-between">
                <span>Sentiment Index</span>
                <Smile className="w-3.5 h-3.5 text-[#3FB950]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#F0F6FC] font-mono">
                  {sentimentData.overallSentiment.score}
                </span>
                <span className="text-[10px] font-mono text-[#3FB950] font-bold">/ 100</span>
              </div>
              <div className="text-[11px] text-[#58A6FF] font-medium truncate">
                {sentimentData.overallSentiment.label}
              </div>
            </div>

            <div className="bg-[#0D1117] border border-[#30363D] rounded-lg p-3.5 space-y-1">
              <div className="text-[10px] font-mono text-[#8B949E] uppercase tracking-wider flex items-center justify-between">
                <span>Resilience Score</span>
                <Award className="w-3.5 h-3.5 text-[#A371F7]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#A371F7] font-mono">
                  {sentimentData.overallSentiment.resilienceScore}%
                </span>
              </div>
              <div className="text-[11px] text-[#8B949E]">
                High emotional recovery capacity
              </div>
            </div>

            <div className="bg-[#0D1117] border border-[#30363D] rounded-lg p-3.5 space-y-1">
              <div className="text-[10px] font-mono text-[#8B949E] uppercase tracking-wider flex items-center justify-between">
                <span>Volatility</span>
                <Activity className="w-3.5 h-3.5 text-[#58A6FF]" />
              </div>
              <div className="text-base font-bold text-[#F0F6FC] font-mono pt-1">
                {sentimentData.overallSentiment.emotionalVolatility}
              </div>
              <div className="text-[11px] text-[#8B949E]">
                Consistent emotional baseline
              </div>
            </div>

            <div className="bg-[#0D1117] border border-[#30363D] rounded-lg p-3.5 space-y-1">
              <div className="text-[10px] font-mono text-[#8B949E] uppercase tracking-wider flex items-center justify-between">
                <span>Burnout Risk</span>
                <ShieldCheck className="w-3.5 h-3.5 text-[#3FB950]" />
              </div>
              <div className="text-base font-bold text-[#3FB950] font-mono pt-1">
                {sentimentData.overallSentiment.burnoutRisk}
              </div>
              <div className="text-[11px] text-[#8B949E]">
                Healthy stress regulation
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Interactive Chart & Selected Point Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Sentiment Timeline Line Chart */}
        <div className="lg:col-span-8 bg-[#161B22] border border-[#30363D] rounded-xl p-4 shadow-lg space-y-3 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#30363D]">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#58A6FF]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#C9D1D9] font-mono">
                Chronological Sentiment Trendline
              </span>
            </div>

            <div className="flex items-center gap-1 bg-[#0D1117] p-1 rounded-lg border border-[#30363D]">
              <button
                onClick={() => setFilterRange('all')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
                  filterRange === 'all'
                    ? 'bg-[#21262D] text-[#58A6FF] font-bold'
                    : 'text-[#8B949E] hover:text-[#C9D1D9]'
                }`}
              >
                All Time ({sentimentData?.trendPoints?.length || 0})
              </button>
              <button
                onClick={() => setFilterRange('30d')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
                  filterRange === '30d'
                    ? 'bg-[#21262D] text-[#58A6FF] font-bold'
                    : 'text-[#8B949E] hover:text-[#C9D1D9]'
                }`}
              >
                Last 30D
              </button>
              <button
                onClick={() => setFilterRange('7d')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
                  filterRange === '7d'
                    ? 'bg-[#21262D] text-[#58A6FF] font-bold'
                    : 'text-[#8B949E] hover:text-[#C9D1D9]'
                }`}
              >
                Last 7D
              </button>
            </div>
          </div>

          {/* SVG Canvas */}
          <div className="relative w-full overflow-hidden bg-[#0D1117] rounded-lg border border-[#30363D]/60 p-2">
            {chartCoordinates.length === 0 ? (
              <div className="py-20 text-center text-xs font-mono text-[#8B949E]">
                No trend points available for this range.
              </div>
            ) : (
              <div className="relative w-full aspect-[720/240]">
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-full overflow-visible"
                >
                  <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#58A6FF" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#58A6FF" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines & Labels */}
                  <line
                    x1={paddingX}
                    y1={paddingY}
                    x2={svgWidth - paddingX}
                    y2={paddingY}
                    stroke="#30363D"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={paddingX - 6}
                    y={paddingY + 3}
                    textAnchor="end"
                    className="text-[9px] font-mono fill-[#8B949E]"
                  >
                    100 (Empowered)
                  </text>

                  <line
                    x1={paddingX}
                    y1={paddingY + graphHeight / 2}
                    x2={svgWidth - paddingX}
                    y2={paddingY + graphHeight / 2}
                    stroke="#30363D"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={paddingX - 6}
                    y={paddingY + graphHeight / 2 + 3}
                    textAnchor="end"
                    className="text-[9px] font-mono fill-[#8B949E]"
                  >
                    50 (Neutral)
                  </text>

                  <line
                    x1={paddingX}
                    y1={svgHeight - paddingY}
                    x2={svgWidth - paddingX}
                    y2={svgHeight - paddingY}
                    stroke="#30363D"
                  />
                  <text
                    x={paddingX - 6}
                    y={svgHeight - paddingY + 3}
                    textAnchor="end"
                    className="text-[9px] font-mono fill-[#8B949E]"
                  >
                    10 (Friction)
                  </text>

                  {/* Area fill */}
                  {areaPath && (
                    <path d={areaPath} fill={`url(#${gradientId})`} />
                  )}

                  {/* Trend line */}
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#58A6FF"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data Points */}
                  {chartCoordinates.map((pt, idx) => {
                    const isSelected = selectedPoint?.sessionId === pt.sessionId;
                    const isHovered = hoveredPoint?.sessionId === pt.sessionId;
                    const scoreColor = pt.sentimentScore >= 75 ? '#3FB950' : pt.sentimentScore >= 50 ? '#58A6FF' : '#F85149';

                    return (
                      <g
                        key={idx}
                        className="cursor-pointer transition-transform"
                        onMouseEnter={() => setHoveredPoint(pt)}
                        onMouseLeave={() => setHoveredPoint(null)}
                        onClick={() => setSelectedPoint(pt)}
                      >
                        {/* Hover Ring */}
                        {(isSelected || isHovered) && (
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="12"
                            fill={scoreColor}
                            fillOpacity="0.2"
                            className="animate-pulse"
                          />
                        )}

                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isSelected ? '6' : '4.5'}
                          fill="#0D1117"
                          stroke={scoreColor}
                          strokeWidth={isSelected ? '3' : '2'}
                        />

                        {/* Date Label on Bottom Axis */}
                        {pointsCount <= 10 || idx % 2 === 0 ? (
                          <text
                            x={pt.x}
                            y={svgHeight - 10}
                            textAnchor="middle"
                            className="text-[8px] font-mono fill-[#8B949E]"
                          >
                            {pt.date.substring(5)}
                          </text>
                        ) : null}
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-[#8B949E] px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#3FB950]" /> High Optimism (75-100)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#58A6FF]" /> Constructive Equilibrium (50-74)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F85149]" /> High Tension/Fatigue (&lt;50)
            </span>
          </div>
        </div>

        {/* Right Inspector: Details of Selected Data Point */}
        <div className="lg:col-span-4 bg-[#161B22] border border-[#30363D] rounded-xl p-4 shadow-lg space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#30363D] pb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#8B949E] font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#58A6FF]" />
                Entry Sentiment Deep-Dive
              </span>
              {selectedPoint && (
                <span className="text-[10px] font-mono text-[#8B949E]">
                  {selectedPoint.date}
                </span>
              )}
            </div>

            {selectedPoint ? (
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-bold text-[#F0F6FC] leading-snug">
                    {selectedPoint.sessionTitle}
                  </h4>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      selectedPoint.sentimentScore >= 75
                        ? 'bg-[#238636]/20 text-[#3FB950] border-[#238636]/40'
                        : selectedPoint.sentimentScore >= 50
                        ? 'bg-[#1F6FEB]/20 text-[#58A6FF] border-[#1F6FEB]/40'
                        : 'bg-[#F85149]/20 text-[#F85149] border-[#F85149]/40'
                    }`}>
                      Score: {selectedPoint.sentimentScore}/100
                    </span>
                    <span className="text-[10px] font-mono bg-[#21262D] text-[#C9D1D9] px-2 py-0.5 rounded border border-[#30363D]">
                      {selectedPoint.primaryEmotion}
                    </span>
                  </div>
                </div>

                <div className="bg-[#0D1117] p-3 rounded-lg border border-[#30363D] space-y-2">
                  <div className="text-[10px] font-mono text-[#8B949E] uppercase tracking-wider">
                    Core Emotional Trigger
                  </div>
                  <p className="text-xs text-[#C9D1D9] font-sans">
                    {selectedPoint.keyTrigger}
                  </p>
                </div>

                {selectedPoint.snippet && (
                  <div className="p-2.5 bg-[#21262D]/60 rounded-lg border border-[#30363D] text-[11px] text-[#8B949E] font-mono italic">
                    "{selectedPoint.snippet}"
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-xs font-mono text-[#8B949E]">
                Click any point on the trend chart to inspect its emotional drivers.
              </div>
            )}
          </div>

          {selectedPoint && (
            <div className="pt-3 border-t border-[#30363D] space-y-2">
              <button
                onClick={() => onOpenJournalSession(selectedPoint.sessionId)}
                className="w-full py-2 px-3 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-[0_0_8px_rgba(35,134,54,0.3)] cursor-pointer"
              >
                <span>OPEN JOURNAL ENTRY</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onExplorePromptInChat(`Help me reflect on why I felt "${selectedPoint.primaryEmotion}" during "${selectedPoint.sessionTitle}". How can I channel this constructively?`)}
                className="w-full py-1.5 px-3 rounded-lg bg-[#21262D] hover:bg-[#30363D] text-[#58A6FF] text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all border border-[#30363D] cursor-pointer"
              >
                <Lightbulb className="w-3 h-3" />
                <span>Reflect on this state in Chat</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid: Emotion Breakdown + Turning Points + Actionable Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Emotion Distribution */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center gap-2 border-b border-[#30363D] pb-2">
            <Heart className="w-4 h-4 text-[#F85149]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#C9D1D9] font-mono">
              Affective Spectrum Breakdown
            </h3>
          </div>

          <div className="space-y-2.5">
            {sentimentData?.emotionBreakdown?.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#C9D1D9] font-medium">{item.emotion}</span>
                  <span className="text-[#8B949E] font-bold">{item.percentage}%</span>
                </div>
                <div className="h-2 w-full bg-[#0D1117] rounded-full overflow-hidden border border-[#30363D]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color || '#58A6FF',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pivotal Inflection Points */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center gap-2 border-b border-[#30363D] pb-2">
            <Zap className="w-4 h-4 text-[#E3B341]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#C9D1D9] font-mono">
              Key Inflection Turning Points
            </h3>
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {sentimentData?.inflectionPoints?.map((inf, idx) => (
              <div
                key={idx}
                onClick={() => onOpenJournalSession(inf.sessionId)}
                className="p-3 bg-[#0D1117] hover:bg-[#21262D] border border-[#30363D] rounded-lg space-y-1 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#F0F6FC] truncate">
                    {inf.title}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[#3FB950] shrink-0">
                    {inf.scoreDelta}
                  </span>
                </div>
                <p className="text-[11px] text-[#8B949E] leading-relaxed line-clamp-2">
                  {inf.description}
                </p>
                <div className="text-[9px] font-mono text-[#58A6FF] pt-1 flex items-center gap-1">
                  <span>From: {inf.sessionTitle}</span>
                  <ChevronRight className="w-2.5 h-2.5" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gemini Wellness & Regulation Insights */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center gap-2 border-b border-[#30363D] pb-2">
            <Lightbulb className="w-4 h-4 text-[#3FB950]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#C9D1D9] font-mono">
              Actionable Wellness Strategies
            </h3>
          </div>

          <div className="space-y-2.5">
            {sentimentData?.actionableWellnessInsights?.map((insight, idx) => (
              <div
                key={idx}
                className="p-3 bg-[#0D1117] border border-[#30363D] rounded-lg space-y-2"
              >
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#3FB950]/20 text-[#3FB950] text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-[#C9D1D9] leading-relaxed">
                    {insight}
                  </p>
                </div>
                <button
                  onClick={() => onExplorePromptInChat(`I'd like to implement this insight into my routine: "${insight}". What are 3 micro-steps I can start with?`)}
                  className="text-[10px] font-mono text-[#58A6FF] hover:underline flex items-center gap-1 pl-6 cursor-pointer"
                >
                  <span>Build micro-habit for this</span>
                  <ChevronRight className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
