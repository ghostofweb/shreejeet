import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Cat } from '@/components/Cat';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { errorMessage } from '@/lib/api';
import { DUR, EASE } from '@/lib/motion';
import { useAuth } from '@/store/auth';

export default function Login() {
  const signIn = useAuth((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(errorMessage(err, 'Could not sign you in'));
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6">
      {/* a warm dusk that slowly breathes behind everything */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 animate-breathe"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 110%, rgba(201,86,107,0.35), transparent 60%),' +
            'radial-gradient(90% 60% at 20% 0%, rgba(230,187,106,0.20), transparent 65%)',
        }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 grain" />

      {/* drifting motes */}
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="pointer-events-none absolute h-1 w-1 rounded-full bg-[var(--accent)]"
          style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, opacity: 0.25 }}
          animate={{ y: [0, -30, 0], opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: 8 + (i % 5), repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 24, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: DUR.scene, ease: EASE.soft }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <Cat pose="sit" mood="happy" size={110} />
          <h1 className="mt-3 font-display text-[2.6rem] leading-none">Our Little World</h1>
          <p className="mt-2 font-hand text-xl opacity-55">only the two of us live here</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <Input
            label="Email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <motion.p
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-sm text-rose"
              role="alert"
            >
              {error}
            </motion.p>
          )}

          <Button type="submit" size="lg" loading={busy} className="w-full">
            Come in
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
