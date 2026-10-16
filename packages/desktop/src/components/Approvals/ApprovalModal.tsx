import React, { useState } from 'react';
import { ShieldAlert, Check, X, AlertTriangle, Layers } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ApprovalModal: React.FC = () => {
  const { pendingApprovals, resolveApproval } = useApp();
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  if (pendingApprovals.length === 0) return null;

  const current = pendingApprovals[0];

  const handleApprove = () => {
    resolveApproval(current.id, 'APPROVED');
  };

  const handleReject = () => {
    resolveApproval(current.id, 'REJECTED', rejectReason || 'Declined by user');
    setShowRejectInput(false);
    setRejectReason('');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-surface-900 border border-surface-750 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Risk Badge */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Action Approval Required</h2>
              <p className="text-xs text-slate-400">Human-in-the-loop safety verification</p>
            </div>
          </div>

          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
              current.riskLevel === 'CRITICAL' || current.riskLevel === 'HIGH'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {current.riskLevel} Risk
          </span>
        </div>

        {/* Action Description */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-300">Requested Action:</div>
          <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 text-sm font-bold text-cyan-400">
            {current.actionName}
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{current.description}</p>
        </div>

        {/* Parameters Breakdown */}
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-slate-400">Action Parameters:</div>
          <pre className="p-3 rounded-xl bg-black/60 border border-surface-800 text-[11px] font-mono text-emerald-400 max-h-36 overflow-y-auto whitespace-pre-wrap">
            {JSON.stringify(current.parameters, null, 2)}
          </pre>
        </div>

        {/* Rejection reason input if toggled */}
        {showRejectInput && (
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">Reason for rejection (optional):</label>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Target video metadata needs revision..."
              className="w-full bg-surface-950 border border-surface-750 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
            />
          </div>
        )}

        {/* Decision Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-surface-800">
          <span className="text-[11px] text-slate-400">Worker: {current.workerType}</span>

          <div className="flex items-center space-x-2">
            {!showRejectInput ? (
              <button
                type="button"
                onClick={() => setShowRejectInput(true)}
                className="px-4 py-2 rounded-xl bg-surface-850 hover:bg-surface-800 text-rose-400 text-xs font-semibold transition border border-surface-750"
              >
                Reject Action
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-md shadow-rose-600/20"
              >
                Confirm Rejection
              </button>
            )}

            <button
              type="button"
              onClick={handleApprove}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/25 flex items-center space-x-1.5"
            >
              <Check size={14} />
              <span>Approve & Continue</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
