import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="page text-center">
      <p className="text-7xl font-bold text-rose-400">404</p>
      <h1 className="mt-2 text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-zinc-400">That route does not exist or has been moved.</p>
      <button type="button" className="btn-primary mt-6" onClick={() => navigate('/')}>
        Return to dashboard
      </button>
    </div>
  );
};

export default NotFound;