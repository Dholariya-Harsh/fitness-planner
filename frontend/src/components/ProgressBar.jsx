import React from 'react';

const ProgressBar = ({ completed = 0, total = 0 }) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="w-full">
      <div className="mb-1.5 flex justify-between text-xs text-zinc-400">
        <span>Completion</span>
        <span>
          {completed} / {total} sets · {percentage}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-emerald-400 transition-all"
          role="progressbar"
          style={{ width: `${percentage}%` }}
          aria-valuenow={percentage}
          aria-valuemin="0"
          aria-valuemax="100"
        />
      </div>
    </div>
  );
};

export default ProgressBar;
