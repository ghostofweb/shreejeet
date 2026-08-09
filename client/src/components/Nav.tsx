import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { DUR, EASE } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/store/auth';

export const SECTIONS = [
  { to: '/story', label: 'Our Story', icon: '🏠', world: 'story' },
  { to: '/reasons', label: 'Reasons', icon: '🌹', world: 'reasons' },
  { to: '/universe', label: 'Our Universe', icon: '🌌', world: 'universe' },
  { to: '/open-when', label: 'Open When…', icon: '💌', world: 'letters' },
  { to: '/confessions', label: 'Confessions', icon: '🫣', world: 'confessions' },
  { to: '/dates', label: 'Important Dates', icon: '🗓️', world: 'dates' },
] as const;

export function Nav() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const user = useAuth((s) => s.user);

  useEffect(() => setOpen(false), [pathname]);

  // Get out of the way while reading; come back the moment they scroll up.
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > 120 && y > last);
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {/* ── Desktop: a floating pill, not a header bar ── */}
      <motion.nav
        aria-label="Sections"
        animate={{ y: hidden ? -96 : 0, opacity: hidden ? 0 : 1 }}
        transition={{ duration: DUR.base, ease: EASE.soft }}
        // x lives in style, not a class: framer composes the transform and would
        // otherwise clobber a Tailwind -translate-x-1/2.
        style={{ x: '-50%' }}
        className="fixed left-1/2 top-5 z-40 hidden md:block"
      >
        <div
          className={cn(
            'flex items-center gap-1 rounded-full px-2 py-1.5',
            'border border-[color-mix(in_srgb,var(--fg)_14%,transparent)]',
            'bg-[color-mix(in_srgb,var(--bg)_78%,transparent)] backdrop-blur-xl lift'
          )}
        >
          {SECTIONS.map((s) => (
            <NavLink key={s.to} to={s.to} className="relative px-3.5 py-1.5 text-sm">
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-[color-mix(in_srgb,var(--accent)_18%,transparent)]"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span
                    className={cn(
                      'relative whitespace-nowrap transition-opacity duration-200',
                      isActive ? 'opacity-100' : 'opacity-55 hover:opacity-90'
                    )}
                  >
                    <span className="mr-1.5 text-xs">{s.icon}</span>
                    {s.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}

          {user && (
            <NavLink
              to="/admin"
              title="Admin"
              className={({ isActive }) =>
                cn(
                  'ml-1 rounded-full px-3 py-1.5 text-sm transition-opacity',
                  isActive ? 'opacity-100' : 'opacity-35 hover:opacity-75'
                )
              }
            >
              🔐
            </NavLink>
          )}
        </div>
      </motion.nav>

      {/* ── Mobile: a single tap target, then a full-screen world list ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close menu' : 'Open menu'}
        className={cn(
          'fixed right-4 top-4 z-[60] flex h-12 w-12 items-center justify-center rounded-full md:hidden',
          'border border-[color-mix(in_srgb,var(--fg)_16%,transparent)]',
          'bg-[color-mix(in_srgb,var(--bg)_85%,transparent)] backdrop-blur-xl'
        )}
      >
        <span className="relative block h-4 w-5">
          <motion.span
            animate={open ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
            className="absolute left-0 top-0 h-[1.5px] w-5 bg-current"
          />
          <motion.span
            animate={open ? { opacity: 0 } : { opacity: 1 }}
            className="absolute left-0 top-[7px] h-[1.5px] w-5 bg-current"
          />
          <motion.span
            animate={open ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
            className="absolute left-0 top-[14px] h-[1.5px] w-5 bg-current"
          />
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DUR.fast }}
            className="fixed inset-0 z-50 flex flex-col justify-center gap-1 bg-[var(--bg)] px-8 md:hidden"
          >
            {SECTIONS.map((s, i) => (
              <motion.div
                key={s.to}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + i * 0.05, duration: DUR.base, ease: EASE.soft }}
              >
                <NavLink
                  to={s.to}
                  className={({ isActive }) =>
                    cn(
                      'block py-3 font-display text-3xl transition-opacity',
                      isActive ? 'opacity-100' : 'opacity-45'
                    )
                  }
                >
                  <span className="mr-3 text-xl">{s.icon}</span>
                  {s.label}
                </NavLink>
              </motion.div>
            ))}
            {user && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-6"
              >
                <NavLink to="/admin" className="text-sm opacity-40">
                  🔐 Admin
                </NavLink>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
