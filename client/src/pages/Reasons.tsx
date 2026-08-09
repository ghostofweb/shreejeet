import { useCallback, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { api, errorMessage } from '@/lib/api';
import { DUR, EASE } from '@/lib/motion';
import { usePeople } from '@/lib/people';
import { CATEGORIES } from '@/lib/reasons';
import type { Reason, ReasonCategory, Role } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useIdentity } from '@/store/identity';
import { Cat } from '@/components/Cat';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select, Textarea } from '@/components/ui/Field';
import { IdentityGate } from '@/components/reasons/IdentityGate';
import { ReasonCard } from '@/components/reasons/ReasonCard';
import { TulipField } from '@/components/reasons/TulipField';

/** Remember enough recent ids that the same reason doesn't come straight back. */
const MEMORY = 10;

export default function Reasons() {
  const identity = useIdentity((s) => s.identity);
  const setIdentity = useIdentity((s) => s.setIdentity);

  if (!identity) return <IdentityGate onChoose={setIdentity} />;
  return <Generator identity={identity} onSwitch={() => setIdentity(null)} />;
}

function Generator({ identity, onSwitch }: { identity: Role; onSwitch: () => void }) {
  const { nameOf } = usePeople();
  const [reason, setReason] = useState<Reason | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  /** false = reasons about you; true = reasons about them. */
  const [aboutThem, setAboutThem] = useState(false);
  const recent = useRef<string[]>([]);

  const other: Role = identity === 'her' ? 'me' : 'her';
  // "about" is who the reason is written about.
  const about: Role = aboutThem ? other : identity;
  const theirName = nameOf(other);

  const question = aboutThem
    ? `Why do you love ${theirName}?`
    : `Why does ${theirName} love you?`;

  const draw = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ about });
      if (recent.current.length) params.set('exclude', recent.current.join(','));
      const { data } = await api.get<Reason>(`/reasons/random?${params}`);

      // Dedupe: the same id must never appear twice in the exclude list.
      recent.current = [data.id, ...recent.current.filter((id) => id !== data.id)].slice(0, MEMORY);
      // AnimatePresence mode="wait" keyed on the id does the swap — setting
      // null in between only queues behind the outgoing card's exit.
      setReason(data);
    } catch (err) {
      setReason(null);
      setError(errorMessage(err, 'Could not find a reason'));
    } finally {
      setLoading(false);
    }
  }, [about]);

  const flip = () => {
    setAboutThem((v) => !v);
    recent.current = [];
    setReason(null);
    setError(null);
  };

  return (
    // overflow-x only: on a short screen the content must still be able to
    // scroll rather than getting clipped under the nav.
    <div className="relative min-h-dvh overflow-x-hidden">
      {/* the world: warm daylight, blush */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(90% 60% at 50% -10%, rgba(255,214,224,0.55), transparent 65%),' +
            'radial-gradient(70% 50% at 15% 100%, rgba(255,236,200,0.5), transparent 70%)',
        }}
      />
      <TulipField bloom={!!reason} />

      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-6 pb-[20dvh] pt-24 sm:pb-[22dvh]">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.slow, ease: EASE.soft }}
          className="mb-2 text-[0.7rem] uppercase tracking-[0.24em] opacity-45"
        >
          Reasons
        </motion.p>

        <motion.h1
          key={question}
          initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: DUR.slow, ease: EASE.soft }}
          className="max-w-2xl text-balance text-center font-display text-[clamp(2rem,6.5vw,3.4rem)] leading-[1.06]"
        >
          {question}
        </motion.h1>

        {/* A single grid cell holds every state, so the outgoing and incoming
            cards overlap exactly and the centre never shifts. Layout modes
            like popLayout pull the exiting card out of flow and throw the new
            one off-centre. */}
        <div className="relative mt-6 grid min-h-[13rem] w-full place-items-center sm:min-h-[15rem]">
          <AnimatePresence>
            {reason ? (
              <ReasonCard key={reason.id} reason={reason} />
            ) : error ? (
              <motion.div
                key="err"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="[grid-area:1/1] flex flex-col items-center gap-3 text-center"
              >
                <Cat pose="sit" mood="shy" size={82} />
                <p className="max-w-xs text-balance text-sm opacity-60">{error}</p>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DUR.base }}
                className="[grid-area:1/1] flex flex-col items-center"
              >
                <Cat
                  pose="hold-heart"
                  mood="happy"
                  size={110}
                  says={reason ? undefined : 'ask me'}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.slow, ease: EASE.soft, delay: 0.2 }}
          className="mt-6 flex flex-col items-center gap-4"
        >
          <Button size="lg" onClick={draw} loading={loading} className="px-9">
            {reason ? 'Another one' : 'Give me a reason'}
          </Button>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
            <button onClick={flip} className="opacity-45 transition-opacity hover:opacity-90">
              {aboutThem ? `show why ${theirName} loves you` : `show why you love ${theirName}`}
            </button>
            <button
              onClick={() => setComposeOpen(true)}
              className="flex items-center gap-1.5 opacity-45 transition-opacity hover:opacity-90"
            >
              <Icon name="plus" size={13} />
              write one
            </button>
            <button onClick={onSwitch} className="opacity-30 transition-opacity hover:opacity-70">
              not you?
            </button>
          </div>
        </motion.div>
      </div>

      <ComposeReason
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        identity={identity}
        other={other}
        theirName={theirName}
      />
    </div>
  );
}

/**
 * Either of them can add a reason without going near the admin — the section is
 * meant to be filled in as things occur to you.
 */
function ComposeReason({
  open,
  onClose,
  identity,
  other,
  theirName,
}: {
  open: boolean;
  onClose: () => void;
  identity: Role;
  other: Role;
  theirName: string;
}) {
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const [category, setCategory] = useState<ReasonCategory>('love');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const save = useMutation({
    mutationFn: async () =>
      (
        await api.post<Reason>('/reasons', {
          text: text.trim(),
          category,
          about: other,
          createdBy: identity,
        })
      ).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reasons'] });
      setDone(true);
      setText('');
      window.setTimeout(() => {
        setDone(false);
        onClose();
      }, 1400);
    },
    onError: (err) => setError(errorMessage(err, 'Could not save that')),
  });

  return (
    <Modal open={open} onClose={onClose} className="max-w-md">
      <AnimatePresence mode="wait">
        {done ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 py-6 text-center"
          >
            <Cat pose="hold-heart" mood="happy" size={92} />
            <p className="font-display text-2xl">Added.</p>
            <p className="text-sm opacity-50">{theirName} will find it eventually.</p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (text.trim().length < 2) return;
              save.mutate();
            }}
          >
            <div>
              <h2 className="font-display text-2xl">Why you love {theirName}</h2>
              <p className="mt-1 text-sm opacity-45">
                Short beats long. It only has to be true.
              </p>
            </div>

            <Textarea
              label="The reason"
              rows={3}
              autoFocus
              required
              maxLength={600}
              placeholder={`Because ${theirName} …`}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            <Select
              label="What kind"
              value={category}
              onChange={(e) => setCategory(e.target.value as ReasonCategory)}
              options={Object.entries(CATEGORIES).map(([value, meta]) => ({
                value,
                label: meta.label,
              }))}
            />

            {error && <p className="text-sm text-rose">{error}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" loading={save.isPending} disabled={text.trim().length < 2}>
                Add it
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </Modal>
  );
}

