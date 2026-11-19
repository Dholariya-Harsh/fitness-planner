import React from 'react';

const SetInputRow = ({ setNumber, targetReps, setData, onChange }) => {
  return (
    <div className="grid grid-cols-12 items-center gap-2 rounded-xl border border-white/10 bg-zinc-950/60 p-2">
      <div className="col-span-2 text-center text-sm font-semibold text-sky-300">
        #{setNumber}
      </div>
      <div className="col-span-4 flex items-center gap-1">
        <input
          type="number"
          step="0.5"
          min="0"
          className="field py-1.5 text-center"
          placeholder="0"
          value={setData.weight}
          onChange={(e) => onChange(setNumber, 'weight', e.target.value)}
        />
        <span className="text-xs text-zinc-500">kg</span>
      </div>
      <div className="col-span-4 flex items-center gap-1">
        <input
          type="number"
          min="0"
          className="field py-1.5 text-center"
          placeholder={targetReps ? `Target ${targetReps}` : '0'}
          value={setData.reps}
          onChange={(e) => onChange(setNumber, 'reps', e.target.value)}
        />
        <span className="text-xs text-zinc-500">reps</span>
      </div>
      <div className="col-span-2 text-center">
        <button
          type="button"
          className={setData.completed ? 'btn-primary px-3 py-1' : 'btn-ghost px-3 py-1'}
          onClick={() => onChange(setNumber, 'completed', !setData.completed)}
          title="Mark complete"
        >
          {setData.completed ? 'Done' : 'Open'}
        </button>
      </div>
    </div>
  );
};

export default SetInputRow;
