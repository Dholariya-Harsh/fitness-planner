import React from 'react';
import { useNavigate } from 'react-router-dom';

const SplitCard = ({ split, onActivate, onDelete }) => {
  const navigate = useNavigate();

  return (
    <div className={`card mb-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${split.is_active ? 'border-emerald-400/50' : ''}`}>
      <div>
        <h3 className="text-lg font-semibold">
          {split.is_active && <span className="mr-2 text-emerald-400">Active</span>}
          {split.name}
        </h3>
        <p className="text-sm text-zinc-400">
          Created {new Date(split.created_at).toLocaleDateString()}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {!split.is_active && (
          <button type="button" className="btn-primary" onClick={() => onActivate(split.id)}>
            Activate
          </button>
        )}
        <button type="button" className="btn-ghost" onClick={() => navigate(`/workout/split/${split.id}/edit`)}>
          Configure days
        </button>
        <button type="button" className="btn-danger" onClick={() => onDelete(split.id)}>
          Delete
        </button>
      </div>
    </div>
  );
};

export default SplitCard;
