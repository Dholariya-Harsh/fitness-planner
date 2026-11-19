import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { nutritionApi } from '../api/nutritionApi'; // Adjust API path as needed

const WaterTracker = () => {
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [dailyWaterLogs, setDailyWaterLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // History Toggle State
  const [showHistory, setShowHistory] = useState(false);
  const [allWaterLogs, setAllWaterLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form State
  const [amountMl, setAmountMl] = useState(250); // Default 250ml glass

  useEffect(() => {
    fetchWaterData();
  }, [selectedDate]);

  const extractArray = (resData) => {
    if (Array.isArray(resData)) return resData;
    if (resData && Array.isArray(resData.results)) return resData.results;
    return [];
  };

  const fetchWaterData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await nutritionApi.getWaterLogs(selectedDate);
      setDailyWaterLogs(extractArray(res.data));
    } catch (err) {
      console.error(err);
      setError('Failed to load water intake logs.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllHistory = async () => {
    setHistoryLoading(true);
    setError('');
    try {
      const res = await nutritionApi.getWaterLogs('all').catch(() => nutritionApi.getWaterLogs(''));
      const fetchedLogs = extractArray(res.data);

      const mergedLogs = [...fetchedLogs, ...dailyWaterLogs];
      const uniqueLogs = Array.from(
        new Map(mergedLogs.map((item) => [item.id, item])).values()
      );

      setAllWaterLogs(uniqueLogs);
    } catch (err) {
      console.error(err);
      setAllWaterLogs(dailyWaterLogs);
      setError('Could not fetch historical water logs; showing available entries.');
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

  const submitWaterLog = async (logAmount) => {
    if (!logAmount || logAmount <= 0) return;

    try {
      const payload = {
        amount_ml: logAmount,
        date: selectedDate,
      };
      const res = await nutritionApi.logWater(payload);
      const updatedLog = res.data;

      const updateLogsArray = (prevLogs) => {
        const logs = Array.isArray(prevLogs) ? prevLogs : [];
        const exists = logs.some((item) => item.id === updatedLog.id);
        if (exists) {
          return logs.map((item) => (item.id === updatedLog.id ? updatedLog : item));
        }
        return [updatedLog, ...logs];
      };

      setDailyWaterLogs((prev) => updateLogsArray(prev));
      setAllWaterLogs((prev) => updateLogsArray(prev));
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to log water intake.');
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    submitWaterLog(parseFloat(amountMl));
  };

  const handleQuickAdd = (amount) => {
    submitWaterLog(amount);
  };

  const handleDeleteLog = async (id) => {
    try {
      await nutritionApi.deleteWaterLog(id);
      setDailyWaterLogs((prev) => (Array.isArray(prev) ? prev.filter((log) => log.id !== id) : []));
      setAllWaterLogs((prev) => (Array.isArray(prev) ? prev.filter((log) => log.id !== id) : []));
    } catch (err) {
      console.error(err);
      setError('Failed to delete water log entry.');
    }
  };

  // Group all logs by date for history view
  const logsByDate = useMemo(() => {
    if (!Array.isArray(allWaterLogs)) return {};
    return allWaterLogs.reduce((acc, log) => {
      const dateKey = log.date || selectedDate || 'Today';
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(log);
      return acc;
    }, {});
  }, [allWaterLogs, selectedDate]);

  // Calculate total water intake for the selected date
  const safeLogs = Array.isArray(dailyWaterLogs) ? dailyWaterLogs : [];
  const totalWaterMl = safeLogs.reduce(
    (acc, log) => acc + (parseFloat(log.amount_ml) || 0),
    0
  );
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="page space-y-6">
      <button type="button" className="btn-ghost" onClick={() => navigate('/')}>Back to dashboard</button>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Hydration</p>
          <h1 className="text-3xl font-bold">Water tracker</h1>
          <p className="text-sm text-zinc-400">Log glasses, bottles, and look back at previous days.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={showHistory ? 'btn-sky' : 'btn-ghost'} onClick={handleToggleHistory}>
            {showHistory ? 'Back to tracker' : 'Hydration log'}
          </button>
          {!showHistory && (
            <input type="date" className="field w-auto" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          )}
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {showHistory ? (
        <div className="card">
          <h2 className="mb-4 text-xl font-semibold text-sky-300">All days</h2>
          {historyLoading ? (
            <p className="text-zinc-400">Loading water history...</p>
          ) : Object.keys(logsByDate).length === 0 ? (
            <p className="text-zinc-400">No hydration logs yet.</p>
          ) : (
            Object.entries(logsByDate)
              .sort(([a], [b]) => new Date(b) - new Date(a))
              .map(([dateStr, logs]) => {
                const dayTotal = logs.reduce((acc, log) => acc + (parseFloat(log.amount_ml) || 0), 0);
                return (
                  <section key={dateStr} className="mb-4 rounded-2xl border border-white/10 bg-zinc-950/50 p-4">
                    <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-3">
                      <h3 className="font-semibold">{dateStr === today ? `${dateStr} · today` : dateStr}</h3>
                      <p className="font-semibold text-sky-300">{dayTotal} ml · {(dayTotal / 1000).toFixed(2)} L</p>
                    </div>
                    <div className="space-y-2">
                      {logs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between rounded-xl bg-zinc-900 px-3 py-2">
                          <p className="font-semibold">{log.amount_ml} ml <span className="text-xs font-normal text-zinc-500">({(parseFloat(log.amount_ml) / 1000).toFixed(2)} L)</span></p>
                          <button type="button" className="btn-danger" onClick={() => handleDeleteLog(log.id)}>Delete</button>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })
          )}
        </div>
      ) : (
        <>
          <div className="stat">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Intake for {selectedDate}</p>
            <p className="mt-1 text-4xl font-bold text-sky-300">
              {totalWaterMl} <span className="text-xl text-zinc-100">ml</span>
            </p>
            <p className="text-sm text-zinc-400">{(totalWaterMl / 1000).toFixed(2)} liters</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card">
              <h2 className="mb-4 text-lg font-semibold">Log water</h2>
              <p className="label">Quick add</p>
              <div className="mb-4 grid grid-cols-3 gap-2">
                {[[250, 'Glass'], [500, 'Bottle'], [750, 'Large']].map(([amount, label]) => (
                  <button key={amount} type="button" className="rounded-xl border border-sky-400/40 px-2 py-3 text-sky-300 hover:bg-sky-400/10" onClick={() => handleQuickAdd(amount)}>
                    <span className="block font-bold">+ {amount} ml</span>
                    <span className="text-xs text-zinc-500">{label}</span>
                  </button>
                ))}
              </div>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="label">Custom amount (ml)</label>
                  <input type="number" min="1" step="1" className="field" value={amountMl} onChange={(e) => setAmountMl(e.target.value)} required />
                </div>
                <button type="submit" className="btn-sky w-full py-2.5">Add water entry</button>
              </form>
            </div>

            <div className="card">
              <h2 className="mb-4 text-lg font-semibold">Logs for {selectedDate}</h2>
              {loading ? (
                <p className="text-zinc-400">Loading logs...</p>
              ) : safeLogs.length === 0 ? (
                <p className="text-zinc-400">Nothing logged for this date.</p>
              ) : (
                <div className="space-y-2">
                  {safeLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2">
                      <div>
                        <p className="font-semibold text-sky-300">{log.amount_ml} ml</p>
                        <p className="text-xs text-zinc-500">{(parseFloat(log.amount_ml) / 1000).toFixed(2)} liters</p>
                      </div>
                      <button type="button" className="btn-danger" onClick={() => handleDeleteLog(log.id)}>Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WaterTracker;
