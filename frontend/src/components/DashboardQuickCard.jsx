import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

const DashboardQuickCard = ({ title, icon: Icon, path, subtitle }) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="group card flex items-start gap-3 p-4 text-left transition hover:border-emerald-400/30 hover:bg-zinc-900"
      onClick={() => navigate(path)}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20">
        {Icon ? <Icon size={18} strokeWidth={1.75} /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="font-semibold text-zinc-50">{title}</span>
          <ArrowUpRight
            size={16}
            strokeWidth={1.75}
            className="shrink-0 text-zinc-500 transition group-hover:text-emerald-300"
          />
        </span>
        {subtitle && <span className="mt-1 block text-sm leading-5 text-zinc-400">{subtitle}</span>}
      </span>
    </button>
  );
};

export default DashboardQuickCard;
