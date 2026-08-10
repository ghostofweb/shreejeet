import { Suspense, lazy, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Loading } from '@/components/ui/States';
import { ResourcePage } from '@/components/admin/resource';
import Login from '@/pages/Login';
import { useAuth } from '@/store/auth';
import { Intro } from '@/intro/Intro';
import { useIntroGate } from '@/intro/useIntroGate';
import {
  confessionsConfig,
  datesConfig,
  lettersConfig,
  reasonsConfig,
  starsConfig,
  storyConfig,
} from '@/pages/admin/configs';

/**
 * Every section is its own chunk. Each carries a lot of scene-specific weight —
 * the star field, the scene registry, the letter sequence — and she only ever
 * looks at one at a time.
 */
const Story = lazy(() => import('@/pages/Story'));
const Reasons = lazy(() => import('@/pages/Reasons'));
const Universe = lazy(() => import('@/pages/Universe'));
const OpenWhen = lazy(() => import('@/pages/OpenWhen'));
const Confessions = lazy(() => import('@/pages/Confessions'));
const Dates = lazy(() => import('@/pages/Dates'));
const Dashboard = lazy(() => import('@/pages/admin/Dashboard'));

const TITLES: Record<string, string> = {
  '/story': 'Our Story',
  '/reasons': 'Reasons',
  '/universe': 'Our Universe',
  '/open-when': 'Open When…',
  '/confessions': 'Confessions',
  '/dates': 'Important Dates',
  '/admin': 'Admin',
};

/** Keeps the tab title in step with the route. */
function useDocumentTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const match = Object.keys(TITLES).find((p) => pathname.startsWith(p));
    document.title = match ? `${TITLES[match]} · Our Little World` : 'Our Little World';
  }, [pathname]);
}

export default function App() {
  const status = useAuth((s) => s.status);
  const restore = useAuth((s) => s.restore);
  const { shouldPlay, finish } = useIntroGate();
  const [introDismissed, setIntroDismissed] = useState(false);
  useDocumentTitle();

  useEffect(() => {
    void restore();
  }, [restore]);

  if (status === 'loading') return <Loading message="unlocking the door…" />;

  // Nothing in this app is public — one gate, everything behind it.
  if (status === 'anon') {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  // The intro replaces everything while it runs — she should not be able to see
  // past it, and nothing behind it should be loading either.
  if (shouldPlay && !introDismissed) {
    return (
      <Intro
        onDone={() => {
          finish();
          setIntroDismissed(true);
        }}
      />
    );
  }

  return (
    <Suspense fallback={<Loading message="one moment…" />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/story" replace />} />
          <Route path="/story" element={<Story />} />
          <Route path="/reasons" element={<Reasons />} />
          <Route path="/universe" element={<Universe />} />
          <Route path="/open-when" element={<OpenWhen />} />
          <Route path="/confessions" element={<Confessions />} />
          <Route path="/dates" element={<Dates />} />

          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/story" element={<ResourcePage config={storyConfig} />} />
          <Route path="/admin/reasons" element={<ResourcePage config={reasonsConfig} />} />
          <Route path="/admin/stars" element={<ResourcePage config={starsConfig} />} />
          <Route path="/admin/letters" element={<ResourcePage config={lettersConfig} />} />
          <Route path="/admin/confessions" element={<ResourcePage config={confessionsConfig} />} />
          <Route path="/admin/dates" element={<ResourcePage config={datesConfig} />} />

          <Route path="*" element={<Navigate to="/story" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
