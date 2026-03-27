
import React from 'react';
import { ChangeLogEntry } from '../services/changeLogService';

interface ChangeLogProps {
  logs: ChangeLogEntry[];
}

const ChangeLog: React.FC<ChangeLogProps> = ({ logs }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Change Log</h2>
      <div className="space-y-4 max-h-60 overflow-y-auto">
        {logs.length === 0 ? (
          <p className="text-slate-500 text-sm">No actions logged yet.</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="border-b border-slate-100 pb-2">
              <p className="text-sm font-medium text-slate-800">{log.action}</p>
              <p className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</p>
              <p className="text-xs text-slate-600 mt-1">{log.details}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChangeLog;
