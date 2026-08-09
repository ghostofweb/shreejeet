import { useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { api, errorMessage, mediaUrl } from '@/lib/api';
import type { ListResponse, MediaRef } from '@/lib/types';
import { DUR, EASE } from '@/lib/motion';
import { cn, formatDate, toDateInput } from '@/lib/utils';
import { Icon, type IconName } from '@/components/Icon';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea, Toggle } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Empty, ErrorState, Skeleton } from '@/components/ui/States';
import { MediaPicker, SingleMediaPicker } from './MediaPicker';

/* ── Field definitions ────────────────────────────────────────── */

export type FieldDef =
  | { name: string; label: string; type: 'text'; required?: boolean; placeholder?: string }
  | { name: string; label: string; type: 'textarea'; rows?: number; placeholder?: string; required?: boolean }
  | { name: string; label: string; type: 'date'; required?: boolean }
  | { name: string; label: string; type: 'number' }
  | { name: string; label: string; type: 'toggle'; hint?: string }
  | { name: string; label: string; type: 'select'; options: { value: string; label: string }[] }
  | { name: string; label: string; type: 'media'; accept?: string }
  | { name: string; label: string; type: 'mediaMulti'; max?: number; accept?: string }
  | { name: string; label: string; type: 'color' };

export interface ResourceConfig<T> {
  /** API path segment, e.g. "story". Also the react-query key. */
  path: string;
  title: string;
  icon: IconName;
  singular: string;
  /** Blurb under the heading — sets the tone for what to write here. */
  blurb?: string;
  fields: FieldDef[];
  emptyValues: Record<string, unknown>;
  /** Row rendering for the list. */
  primary: (item: T) => string;
  secondary?: (item: T) => string;
  thumbnail?: (item: T) => MediaRef | null | undefined;
}

const AUTHOR_OPTIONS = [
  { value: 'me', label: 'Me' },
  { value: 'her', label: 'Her' },
  { value: 'both', label: 'Both of us' },
];

/* ── The page ─────────────────────────────────────────────────── */

export function ResourcePage<T extends { id: string; createdBy: string }>({
  config,
}: {
  config: ResourceConfig<T>;
}) {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  // The dashboard's "+ Add" links land here with ?new=1 and open the form.
  const [editing, setEditing] = useState<T | 'new' | null>(params.has('new') ? 'new' : null);
  const [search, setSearch] = useState('');

  const closeForm = () => {
    setEditing(null);
    if (params.has('new')) {
      params.delete('new');
      setParams(params, { replace: true });
    }
  };

  const query = useQuery({
    queryKey: [config.path, 'admin'],
    queryFn: async () =>
      (await api.get<ListResponse<T>>(`/${config.path}?limit=200`)).data,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/${config.path}/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [config.path] }),
  });

  const items = useMemo(() => {
    const all = query.data?.items ?? [];
    if (!search.trim()) return all;
    const needle = search.toLowerCase();
    return all.filter((i) =>
      `${config.primary(i)} ${config.secondary?.(i) ?? ''}`.toLowerCase().includes(needle)
    );
  }, [query.data, search, config]);

  return (
    <div className="mx-auto max-w-4xl px-5 pb-24 pt-24 sm:px-8">
      <header className="mb-8">
        <p className="text-sm opacity-40">
          <Link to="/admin" className="hover:opacity-100">
            Admin
          </Link>{' '}
          / {config.title}
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 font-display text-4xl">
              <Icon name={config.icon} size={30} className="opacity-70" />
              {config.title}
            </h1>
            {config.blurb && <p className="mt-1.5 max-w-lg text-sm opacity-45">{config.blurb}</p>}
          </div>
          <Button onClick={() => setEditing('new')}>+ Add {config.singular}</Button>
        </div>
      </header>

      {(query.data?.items.length ?? 0) > 6 && (
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="mb-5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm outline-none placeholder:opacity-35 focus:border-[var(--accent)]"
        />
      )}

      {query.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[4.5rem]" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState message={errorMessage(query.error)} onRetry={() => query.refetch()} />
      ) : !items.length ? (
        <Empty
          title={search ? 'Nothing matches that' : `No ${config.title.toLowerCase()} yet`}
          hint={search ? undefined : `Add the first ${config.singular.toLowerCase()} and it appears here.`}
          action={
            !search && <Button onClick={() => setEditing('new')}>+ Add {config.singular}</Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.li
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: DUR.base, ease: EASE.soft }}
              >
                <div className="group flex items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-3 transition-colors hover:border-white/20">
                  <Thumb item={item} config={config} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{config.primary(item)}</p>
                    {config.secondary && (
                      <p className="truncate text-sm opacity-45">{config.secondary(item)}</p>
                    )}
                  </div>
                  <span className="hidden shrink-0 text-xs opacity-30 sm:block">
                    {item.createdBy}
                  </span>
                  <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(item)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose"
                      onClick={() => {
                        if (confirm(`Delete "${config.primary(item)}"?`)) remove.mutate(item.id);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <ResourceForm
        config={config}
        item={editing === 'new' ? null : editing}
        open={editing !== null}
        onClose={closeForm}
      />
    </div>
  );
}

function Thumb<T extends { id: string }>({
  item,
  config,
}: {
  item: T;
  config: ResourceConfig<T>;
}) {
  const media = config.thumbnail?.(item);
  if (!media) {
    return (
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/5 opacity-40">
        <Icon name={config.icon} size={22} />
      </div>
    );
  }
  return media.type === 'video' ? (
    <video src={mediaUrl(media.url)} muted className="h-14 w-14 shrink-0 rounded-xl object-cover" />
  ) : (
    <img
      src={mediaUrl(media.url)}
      alt=""
      loading="lazy"
      className="h-14 w-14 shrink-0 rounded-xl object-cover"
    />
  );
}

/* ── The form ─────────────────────────────────────────────────── */

function ResourceForm<T extends { id: string }>({
  config,
  item,
  open,
  onClose,
}: {
  config: ResourceConfig<T>;
  item: T | null;
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Seed the form when the modal opens (not on every render).
  if (open && !ready) {
    setValues(item ? { ...config.emptyValues, ...(item as object) } : { ...config.emptyValues });
    setReady(true);
    setError(null);
  }
  if (!open && ready) setReady(false);

  const set = (name: string, value: unknown) => setValues((v) => ({ ...v, [name]: value }));

  const save = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const body = serialise(payload, config.fields);
      return item
        ? (await api.patch(`/${config.path}/${item.id}`, body)).data
        : (await api.post(`/${config.path}`, body)).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [config.path] });
      onClose();
    },
    onError: (err) => setError(errorMessage(err, 'Could not save that')),
  });

  return (
    <Modal open={open} onClose={onClose} className="max-w-xl">
      <h2 className="mb-5 font-display text-2xl">
        {item ? `Edit ${config.singular.toLowerCase()}` : `New ${config.singular.toLowerCase()}`}
      </h2>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(values);
        }}
      >
        {config.fields.map((field) => (
          <FieldRenderer key={field.name} field={field} value={values[field.name]} onChange={set} />
        ))}

        <Select
          label="Added by"
          options={AUTHOR_OPTIONS}
          value={(values.createdBy as string) ?? 'me'}
          onChange={(e) => set('createdBy', e.target.value)}
        />

        {error && <p className="text-sm text-rose">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={save.isPending}>
            {item ? 'Save changes' : `Add ${config.singular.toLowerCase()}`}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
}): ReactNode {
  switch (field.type) {
    case 'text':
      return (
        <Input
          label={field.label}
          required={field.required}
          placeholder={field.placeholder}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(field.name, e.target.value)}
        />
      );
    case 'textarea':
      return (
        <Textarea
          label={field.label}
          rows={field.rows ?? 4}
          required={field.required}
          placeholder={field.placeholder}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(field.name, e.target.value)}
        />
      );
    case 'date':
      return (
        <Input
          label={field.label}
          type="date"
          required={field.required}
          value={toDateInput(value as string)}
          onChange={(e) => onChange(field.name, e.target.value)}
        />
      );
    case 'number':
      return (
        <Input
          label={field.label}
          type="number"
          value={(value as number) ?? 0}
          onChange={(e) => onChange(field.name, Number(e.target.value))}
        />
      );
    case 'toggle':
      return (
        <div className="pt-1">
          <Toggle
            label={field.label}
            checked={Boolean(value)}
            onChange={(v) => onChange(field.name, v)}
          />
          {field.hint && <p className="mt-1 text-xs opacity-40">{field.hint}</p>}
        </div>
      );
    case 'select':
      return (
        <Select
          label={field.label}
          options={field.options}
          value={(value as string) ?? field.options[0]?.value}
          onChange={(e) => onChange(field.name, e.target.value)}
        />
      );
    case 'color':
      return (
        <label className="block space-y-1.5">
          <span className="block text-[0.72rem] font-medium uppercase tracking-[0.14em] opacity-55">
            {field.label}
          </span>
          <input
            type="color"
            value={(value as string) ?? '#c9566b'}
            onChange={(e) => onChange(field.name, e.target.value)}
            className="h-10 w-20 cursor-pointer rounded-lg border border-white/10 bg-transparent"
          />
        </label>
      );
    case 'media':
      return (
        <SingleMediaPicker
          label={field.label}
          accept={field.accept}
          value={value as MediaRef | null}
          onChange={(v) => onChange(field.name, v)}
        />
      );
    case 'mediaMulti':
      return (
        <MediaPicker
          label={field.label}
          max={field.max ?? 12}
          accept={field.accept}
          value={(value as MediaRef[]) ?? []}
          onChange={(v) => onChange(field.name, v)}
        />
      );
  }
}

/** Strips server-managed fields and normalises empties so zod is happy. */
function serialise(values: Record<string, unknown>, fields: FieldDef[]) {
  const allowed = new Set([...fields.map((f) => f.name), 'createdBy']);
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(values)) {
    if (!allowed.has(key)) continue;
    const field = fields.find((f) => f.name === key);

    if (value === '' || value === undefined) {
      // An empty date must become null, not "" — zod would reject the string.
      if (field?.type === 'date') out[key] = null;
      continue;
    }
    out[key] = value;
  }
  return out;
}

export { AUTHOR_OPTIONS };
