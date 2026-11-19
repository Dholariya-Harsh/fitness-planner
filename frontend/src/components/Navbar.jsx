import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Droplets,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  User,
  Utensils,
  X,
} from 'lucide-react';

const links = [
  { to: '/', label: 'Dashboard', end: true, icon: LayoutDashboard },
  { to: '/workout', label: 'Workout', icon: Dumbbell },
  { to: '/nutrition', label: 'Nutrition', icon: Utensils },
  { to: '/water', label: 'Water', icon: Droplets },
  { to: '/sleep', label: 'Sleep', icon: Moon },
];

const linkClass = ({ isActive }) =>
  `inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
    isActive ? 'bg-emerald-400 text-zinc-950' : 'text-zinc-300 hover:bg-white/5 hover:text-white'
  }`;

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!token) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <NavLink to="/" className="inline-flex items-center gap-2 text-lg font-bold tracking-tight text-emerald-400" onClick={() => setOpen(false)}>
          <Dumbbell size={18} strokeWidth={1.75} />
          FitnessPlanner
        </NavLink>

        <button
          type="button"
          className="btn-ghost px-3 py-1.5 md:hidden"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={18} strokeWidth={1.75} /> : <Menu size={18} strokeWidth={1.75} />}
        </button>

        <nav className={`${open ? 'flex' : 'hidden'} absolute left-0 right-0 top-full flex-col gap-2 border-b border-white/10 bg-zinc-950 p-4 md:static md:flex md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0`}>
          <div className="flex flex-col gap-1 md:flex-row md:items-center">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={linkClass}
                  onClick={() => setOpen(false)}
                >
                  <Icon size={15} strokeWidth={1.75} />
                  {link.label}
                </NavLink>
              );
            })}
          </div>
          <div className="mt-2 flex items-center gap-2 md:ml-4 md:mt-0">
            <NavLink to="/profile" className={linkClass} onClick={() => setOpen(false)}>
              <User size={15} strokeWidth={1.75} />
              Profile
            </NavLink>
            <button type="button" onClick={handleLogout} className="btn-danger">
              <LogOut size={15} strokeWidth={1.75} />
              Logout
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
