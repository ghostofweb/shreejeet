import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Nav, SECTIONS } from './Nav';
import { pageTransition } from '@/lib/motion';

/** Sets <body data-world> so the CSS tokens (and therefore the whole mood)
 *  change with the route. */
function useWorld() {
  const { pathname } = useLocation();
  useEffect(() => {
    const section = SECTIONS.find((s) => pathname.startsWith(s.to));
    const world = pathname.startsWith('/admin') ? 'admin' : (section?.world ?? 'story');
    document.body.dataset.world = world;
  }, [pathname]);
}

export function Layout() {
  const location = useLocation();
  useWorld();

  return (
    <div className="relative min-h-dvh">
      <Nav />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname.split('/').slice(0, 2).join('/')}
          variants={pageTransition}
          initial="hidden"
          animate="show"
          exit="exit"
          className="min-h-dvh"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
