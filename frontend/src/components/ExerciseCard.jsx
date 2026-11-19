import React from 'react';
import SetInputRow from './SetInputRow';

const ExerciseCard = ({ exerciseName, category, plannedSets, exerciseLogData, onSetChange }) => {
  return (
    <div className="card mb-3 p-0 overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <h3 className="text-base font-semibold text-sky-300">{exerciseName}</h3>
        <span className="rounded-full bg-sky-400/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-sky-200">
          {category || 'Exercise'}
        </span>
      </div>
      <div className="space-y-2 p-4">
        <div className="grid grid-cols-12 text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          <div className="col-span-2">Set</div>
          <div className="col-span-4">Weight</div>
          <div className="col-span-4">Reps</div>
          <div className="col-span-2">Done</div>
        </div>
        {plannedSets.map((setObj) => (
          <SetInputRow
            key={setObj.id}
            setNumber={setObj.set_number}
            targetReps={setObj.target_reps}
            setData={exerciseLogData[setObj.set_number] || { weight: '', reps: '', completed: false }}
            onChange={(setNum, field, val) => onSetChange(setObj.id, setNum, field, val)}
          />
        ))}
      </div>
    </div>
  );
};

export default ExerciseCard;
