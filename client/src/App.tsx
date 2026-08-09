import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Loading } from '@/components/ui/States';
import { ResourcePage } from '@/components/admin/resource';
import Login from '@/pages/Login';
import Dashboard from '@/pages/admin/Dashboard';
import {
  confessionsConfig,
  datesConfig,
  lettersConfig,
  reasonsConfig,
  starsConfig,
  storyConfig,
} from '@/pages/admin/configs';
import Story from '@/pages/Story';
import {
  ConfessionsPage,
  DatesPage,
  OpenWhenPage,
  ReasonsPage,
  UniversePage,
} from '@/pages/ComingSoon';
import { useAuth } from '@/store/auth';

export default function App() {
  const status = useAuth((s) => s.status);
  const restore = useAuth((s) => s.restore);

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

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/story" replace />} />
        <Route path="/story" element={<Story />} />
        <Route path="/reasons" element={<ReasonsPage />} />
        <Route path="/universe" element={<UniversePage />} />
        <Route path="/open-when" element={<OpenWhenPage />} />
        <Route path="/confessions" element={<ConfessionsPage />} />
        <Route path="/dates" element={<DatesPage />} />

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
  );
}
