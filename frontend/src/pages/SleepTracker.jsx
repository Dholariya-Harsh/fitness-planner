import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { nutritionApi } from '../api/nutritionApi'; // Adjust API path as needed

const SleepTracker = () => {
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [dailySleepLogs, setDailySleepLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // View mode toggle
  const [showHistory, setShowHistory] = useState(false);
  const [allSleepLogs, setAllSleepLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form State
  const [hours, setHours] = useState(7.5);
  const [quality, setQuality] = useState(3);

  useEffect(() => {
    fetchSleepData();
  }, [selectedDate]);

  const extractArray = (resData) => {
    if (Array.isArray(resData)) return resData;
    if (resData && Array.isArray(resData.results)) return resData.results;
    return [];
  };

  const fetchSleepData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await nutritionApi.getSleepLogs(selectedDate);
      setDailySleepLogs(extractArray(res.data));
    } catch (err) {
      console.error(err);
      setError('Failed to load sleep log.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllHistory = async () => {
    setHistoryLoading(true);
    setError('');
    try {
      const res = await nutritionApi.getSleepLogs('all');
      setAllSleepLogs(extractArray(res.data));
    } catch (err) {
      console.error(err);
      setAllSleepLogs(dailySleepLogs);
      setError('Could not fetch historical sleep logs.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleToggleHistory = () => {
    if (!showHistory) {
      fetchAllHistory();
    }
    setShowHistory(!showHistory);
  };

  const handleLogSleep = async (e) => {
    e.preventDefault();
    setError('');

    const parsedHours = parseFloat(hours);
    if (isNaN(parsedHours) || parsedHours < 0 || parsedHours > 24) {
      setError('Please enter valid sleep hours (0 - 24).');
      return;
    }

    try {
      const payload = {
        date: selectedDate,
        hours: parsedHours,
        quality: parseInt(quality, 10),
      };

      const res = await nutritionApi.logSleep(payload);
      const updatedLog = res.data;

      const updateLogsArray = (prevLogs) => {
        const logs = Array.isArray(prevLogs) ? prevLogs : [];
        const exists = logs.some((item) => item.id === updatedLog.id);
        if (exists) {
          return logs.map((item) => (item.id === updatedLog.id ? updatedLog : item));
        }
        return [updatedLog, ...logs];
      };

      setDailySleepLogs((prev) => updateLogsArray(prev));
      setAllSleepLogs((prev) => updateLogsArray(prev));
    } catch (err) {
      console.error(err);
      setError('Failed to log sleep entry.');
    }
  };

  const handleDeleteLog = async (id) => {
    try {
      await nutritionApi.deleteSleepLog(id);
      setDailySleepLogs((prev) => (Array.isArray(prev) ? prev.filter((log) => log.id !== id) : []));
      setAllSleepLogs((prev) => (Array.isArray(prev) ? prev.filter((log) => log.id !== id) : []));
    } catch (err) {
      console.error(err);
      setError('Failed to delete sleep entry.');
    }
  };

  // Safe daily log calculation
  const safeLogs = Array.isArray(dailySleepLogs) ? dailySleepLogs : [];
  const currentLog = safeLogs.length > 0 ? safeLogs[0] : null;

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <div className="page space-y-6">
      <button type="button" className="btn-ghost" onClick={() => navigate('/')}>Back to dashboard</button>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Recovery</p>
          <h1 className="text-3xl font-bold">Sleep tracker</h1>
          <p className="text-sm text-zinc-400">Duration and quality, day by day.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={showHistory ? 'btn-sky' : 'btn-ghost'} onClick={handleToggleHistory}>
            {showHistory ? 'Back to tracker' : 'Sleep history'}
          </button>
          {!showHistory && (
            <input type="date" className="field w-auto" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          )}
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {showHistory ? (
        <div className="card">
          <h2 className="mb-4 text-xl font-semibold text-amber-300">Sleep history</h2>
          {historyLoading ? (
            <p className="text-zinc-400">Loading sleep history...</p>
          ) : allSleepLogs.length === 0 ? (
            <p className="text-zinc-400">No sleep logs yet.</p>
          ) : (
            <div className="space-y-2">
              {allSleepLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3">
                  <div>
                    <p className="font-semibold text-amber-300">{log.date}</p>
                    <p className="text-sm text-zinc-300">{log.hours} hours · {renderStars(log.quality)}</p>
                  </div>
                  <button type="button" className="btn-danger" onClick={() => handleDeleteLog(log.id)}>Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="stat">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Sleep on {selectedDate}</p>
            <p className="mt-1 text-4xl font-bold text-amber-300">
              {currentLog ? currentLog.hours : 0} <span className="text-xl text-zinc-100">hrs</span>
            </p>
            {currentLog && <p className="text-sm text-zinc-400">Quality {renderStars(currentLog.quality)} ({currentLog.quality}/5)</p>}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card">
              <h2 className="mb-4 text-lg font-semibold">Log sleep</h2>
              <form onSubmit={handleLogSleep} className="space-y-4">
                <div>
                  <label className="label">Hours slept</label>
                  <input type="number" min="0" max="24" step="0.5" className="field" value={hours} onChange={(e) => setHours(e.target.value)} required />
                </div>
                <div>
                  <label className="label">Sleep quality</label>
                  <select className="field" value={quality} onChange={(e) => setQuality(e.target.value)}>
                    <option value={1}>1 — Poor</option>
                    <option value={2}>2 — Fair</option>
                    <option value={3}>3 — Average</option>
                    <option value={4}>4 — Good</option>
                    <option value={5}>5 — Excellent</option>
                  </select>
                </div>
                <button type="submit" className="btn-amber w-full py-2.5">
                  {currentLog ? 'Update sleep entry' : 'Save sleep entry'}
                </button>
              </form>
            </div>

            <div className="card">
              <h2 className="mb-4 text-lg font-semibold">Entry for {selectedDate}</h2>
              {loading ? (
                <p className="text-zinc-400">Loading sleep data...</p>
              ) : !currentLog ? (
                <p className="text-zinc-400">No sleep logged for this date.</p>
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3">
                  <div>
                    <p className="text-lg font-semibold text-amber-300">{currentLog.hours} hours</p>
                    <p className="text-sm text-zinc-400">{renderStars(currentLog.quality)} ({currentLog.quality}/5)</p>
                  </div>
                  <button type="button" className="btn-danger" onClick={() => handleDeleteLog(currentLog.id)}>Delete</button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SleepTracker;
