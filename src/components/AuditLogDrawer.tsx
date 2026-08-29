import React, { useState } from 'react';
import { Activity, Trash2, CheckCircle2, AlertTriangle, Cpu, Layers, RefreshCw, X, ChevronRight, ShieldCheck } from 'lucide-react';
import { TransactionRecord } from '../types';

interface AuditLogDrawerProps {
  logs: TransactionRecord[];
  onClear: () => void;
  onRefresh: () => void;
}

export const AuditLogDrawer: React.FC<AuditLogDrawerProps> = ({ logs, onClear, onRefresh }) => {
  const [selectedLog, setSelectedLog] = useState<TransactionRecord | null>(null);

  return (
    <div className="bg-[#161B22] border border-[#30363D] rounded-lg overflow-hidden flex flex-col">
      <div className="px-4 py-2 bg-[#21262D] border-b border-[#30363D] flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-[#58A6FF]" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9D1D9] font-mono">
            Transaction & Resilience Audit Trail
          </span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#0D1117] text-[#58A6FF] font-mono border border-[#30363D]">
            {logs.length} EVENTS
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onRefresh}
            className="p-1 rounded bg-[#0D1117] hover:bg-[#30363D] text-[#8B949E] hover:text-[#C9D1D9] border border-[#30363D] text-xs transition-all"
            title="Refresh Audit Trail"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
          <button
            onClick={onClear}
            disabled={logs.length === 0}
            className="px-2 py-0.5 rounded bg-[#0D1117] hover:bg-[#F85149]/20 text-[#8B949E] hover:text-[#F85149] border border-[#30363D] text-[10px] font-mono flex items-center gap-1 transition-all disabled:opacity-40"
          >
            <Trash2 className="w-3 h-3" />
            <span>CLEAR</span>
          </button>
        </div>
      </div>

      <div className="p-3">
        {logs.length === 0 ? (
          <div className="py-6 text-center text-[#484F58] text-[11px] font-mono">
            No transactions logged yet. Execute a Threat Model, Security Review, or Fallback Request to generate audit events.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {logs.map((log) => {
              const isRecovered = log.status === 'recovered';
              const isFailed = log.status === 'failed';
              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="p-2 rounded bg-[#0D1117] border border-[#30363D] hover:border-[#58A6FF] transition-all cursor-pointer flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    {isRecovered ? (
                      <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-[#D29922]/20 border border-[#D29922]/40 text-[#D29922] shrink-0">
                        [REC]
                      </span>
                    ) : isFailed ? (
                      <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-[#F85149]/20 border border-[#F85149]/40 text-[#F85149] shrink-0">
                        [ERR]
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-[#238636]/20 border border-[#238636]/40 text-[#3FB950] shrink-0">
                        [OK]
                      </span>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono uppercase text-[9px] px-1 py-0.2 rounded bg-[#21262D] text-[#C9D1D9]">
                          {log.type.replace('_', ' ')}
                        </span>
                        <span className="font-mono text-[#58A6FF] text-[10px]">{log.modelUsed}</span>
                        {isRecovered && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#D29922]/20 text-[#D29922]">
                            Auto-Recovered
                          </span>
                        )}
                      </div>
                      <p className="text-[#8B949E] text-[10px] truncate max-w-md mt-0.5 font-mono">
                        {log.inputSummary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-right shrink-0">
                    <div className="font-mono text-[10px] text-[#8B949E]">
                      <div>{log.latencyMs}ms</div>
                      <div className="text-[9px] text-[#484F58]">{new Date(log.timestamp).toLocaleTimeString()}</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#484F58]" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#161B22] border border-[#30363D] rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-3 shadow-2xl overflow-hidden flex flex-col">
            <div className="px-4 py-2.5 bg-[#21262D] border-b border-[#30363D] flex items-center justify-between">
              <div>
                <h4 className="font-mono font-bold text-xs text-[#E0E0E0] flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#58A6FF]" />
                  Audit Record: {selectedLog.id}
                </h4>
                <p className="text-[10px] text-[#8B949E] font-mono mt-0.2">{selectedLog.timestamp}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded bg-[#0D1117] hover:bg-[#30363D] text-[#8B949E] hover:text-[#C9D1D9] border border-[#30363D]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-[#0D1117] p-2.5 rounded border border-[#30363D]">
                  <span className="text-[#8B949E] text-[10px] block">Execution Model:</span>
                  <span className="text-[#3FB950] font-bold text-[11px]">{selectedLog.modelUsed}</span>
                </div>
                <div className="bg-[#0D1117] p-2.5 rounded border border-[#30363D]">
                  <span className="text-[#8B949E] text-[10px] block">Latency / Status:</span>
                  <span className="text-[#58A6FF] font-bold text-[11px]">{selectedLog.latencyMs}ms ({selectedLog.status})</span>
                </div>
              </div>

              {/* Fallback Trace */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8B949E]">Fallback Ladder Trace</span>
                <div className="bg-[#0D1117] p-2.5 rounded border border-[#30363D] space-y-1 font-mono text-[10px]">
                  {selectedLog.fallbackTrace.map((trace, idx) => (
                    <div key={idx} className="text-[#C9D1D9]">• {trace}</div>
                  ))}
                </div>
              </div>

              {/* Sanitized Payload (Undefined Stripped) */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8B949E]">Sanitized Database Payload (Undefined Keys Stripped)</span>
                <div className="bg-[#0D1117] p-2.5 rounded border border-[#30363D] font-mono text-[10px] text-[#A5D6FF] overflow-x-auto">
                  <pre>{JSON.stringify(selectedLog.sanitizedPayload, null, 2)}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
