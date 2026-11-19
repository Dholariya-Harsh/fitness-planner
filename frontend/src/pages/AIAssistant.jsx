import React from 'react';
import { useNavigate } from 'react-router-dom';

const AIAssistant = () => {
  const navigate = useNavigate();
  return (
    <div className="page">
      <button type="button" className="btn-ghost mb-4" onClick={() => navigate('/')}>
        Back to dashboard
      </button>
      <div className="card">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">Coach</p>
        <h1 className="mt-1 text-2xl font-bold">AI fitness assistant</h1>
        <p className="mt-2 text-zinc-400">Your personalized training and nutrition coach lives here.</p>
      </div>
    </div>
  );
};

export default AIAssistant;