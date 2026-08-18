import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { api, errorMessage, mediaUrl } from '@/lib/api';
import type { ListResponse, MediaAsset, MediaRef } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/Icon';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/States';

function useMediaLibrary() {
  return useQuery({
    queryKey: ['media'],
    queryFn: async () => (await api.get<ListResponse<MediaAsset>>('/media?limit=200')).data,
  });
}

function toRef(m: MediaAsset): MediaRef {
  return { mediaId: m.id, url: m.url, type: m.type, width: m.width, height: m.height, alt: m.alt };
}

/** "video/*" → video only, "image/*" → images only, otherwise everything. */
function kindsFor(accept?: string): ('image' | 'video')[] {
  if (!accept) return ['image', 'video'];
  const wantsImage = accept.includes('image');
  const wantsVideo = accept.includes('video') || accept.includes('audio');
  if (wantsImage && !wantsVideo) return ['image'];
  if (wantsVideo && !wantsImage) return ['video'];
  return ['image', 'video'];
}

function prettyBytes(n?: number): string {
  if (!n) return '';
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function prettyDuration(s?: number): string {
  if (!s) return '';
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

interface PickerProps {
  value: MediaRef[];
  onChange: (next: MediaRef[]) => void;
  max?: number;
  label?: string;
  accept?: string;
}

export function MediaPicker({
  value,
  onChange,
  max = 12,
  label = 'Photos',
  accept = 'image/*,video/*',
}: PickerProps) {
  const [open, setOpen] = useState(false);
  const kinds = kindsFor(accept);
  const noun = kinds.length === 1 ? (kinds[0] === 'video' ? 'video' : 'photo') : 'file';

  return (
    <div className="space-y-2">
      <span className="block text-[0.72rem] font-medium uppercase tracking-[0.14em] opacity-55">
        {label}
      </span>

      <div className="flex flex-wrap gap-2">
        <AnimatePresence initial={false}>
          {value.map((m, i) => (
            <motion.div
              key={m.url}
              layout
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className="group relative h-20 w-20 overflow-hidden rounded-xl border border-white/15"
            >
              <Thumb asset={m} />
              <TypeBadge type={m.type} />
              <button
                type="button"
                aria-label={`Remove ${noun}`}
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/75 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                <Icon name="close" size={11} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {value.length < max && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/25 opacity-55 transition-all duration-200 hover:border-[var(--accent)] hover:opacity-100"
          >
            <Icon name="plus" size={18} />
            <span className="text-[0.58rem] uppercase tracking-wider">{noun}</span>
          </button>
        )}
      </div>

      <MediaLibraryModal
        open={open}
        onClose={() => setOpen(false)}
        accept={accept}
        kinds={kinds}
        onPick={(asset) => {
          const ref = toRef(asset);
          if (max === 1) {
            onChange([ref]);
            setOpen(false);
            return;
          }
          if (!value.some((v) => v.url === ref.url)) onChange([...value, ref].slice(0, max));
        }}
        selectedUrls={value.map((v) => v.url)}
      />
    </div>
  );
}

/** A video renders its own poster frame; an image just renders. */
function Thumb({ asset }: { asset: MediaRef | MediaAsset }) {
  if (asset.type === 'video') {
    return (
      <video
        src={`${mediaUrl(asset.url)}#t=0.1`}
        muted
        playsInline
        preload="metadata"
        className="h-full w-full bg-black object-cover"
      />
    );
  }
  return (
    <img
      src={mediaUrl(asset.url)}
      alt={asset.alt ?? ''}
      loading="lazy"
      decoding="async"
      className="h-full w-full object-cover"
    />
  );
}

/** The thing that was missing: you can always tell what you're looking at. */
function TypeBadge({ type, format }: { type: 'image' | 'video'; format?: string }) {
  const isVideo = type === 'video';
  return (
    <span
      className={cn(
        'pointer-events-none absolute bottom-1 left-1 flex items-center gap-1 rounded-md px-1.5 py-0.5',
        'text-[0.55rem] font-semibold uppercase tracking-wider backdrop-blur-sm',
        isVideo ? 'bg-[#c9566b]/85 text-white' : 'bg-black/65 text-white/90'
      )}
    >
      <Icon name={isVideo ? 'play' : 'camera'} size={9} filled={isVideo} />
      {format || (isVideo ? 'video' : 'photo')}
    </span>
  );
}

function MediaLibraryModal({
  open,
  onClose,
  onPick,
  accept,
  kinds,
  selectedUrls,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (m: MediaAsset) => void;
  accept: string;
  kinds: ('image' | 'video')[];
  selectedUrls: string[];
}) {
  const { data, isLoading } = useMediaLibrary();
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');

  // Only ever show what this field can actually take.
  const eligible = useMemo(
    () => (data?.items ?? []).filter((m) => kinds.includes(m.type)),
    [data, kinds]
  );
  const shown = useMemo(
    () => (filter === 'all' ? eligible : eligible.filter((m) => m.type === filter)),
    [eligible, filter]
  );
  const canFilter = kinds.length > 1 && eligible.some((m) => m.type === 'video');

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const uploaded: MediaAsset[] = [];
      for (const file of files) {
        const form = new FormData();
        form.append('file', file);
        const { data } = await api.post<MediaAsset>('/media', form);
        uploaded.push(data);
      }
      return uploaded;
    },
    onSuccess: (uploaded) => {
      qc.invalidateQueries({ queryKey: ['media'] });
      setError(null);
      uploaded.filter((m) => kinds.includes(m.type)).forEach(onPick);
    },
    onError: (err) => setError(errorMessage(err, 'That upload did not work')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/media/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media'] });
    },
    onError: (err) => setError(errorMessage(err, 'Could not delete media')),
  });

  function handleFiles(list: FileList | null) {
    if (!list?.length) return;
    uploadMutation.mutate(Array.from(list));
  }

  const wanted =
    kinds.length === 1 ? (kinds[0] === 'video' ? 'Videos' : 'Photos') : 'Photos and videos';

  return (
    <Modal open={open} onClose={onClose} className="max-w-3xl">
      <div className="mb-1 flex items-baseline justify-between">
        <h2 className="font-display text-2xl">{wanted}</h2>
        <button onClick={onClose} className="text-sm opacity-50 transition-opacity hover:opacity-100">
          done
        </button>
      </div>
      <p className="mb-4 text-sm opacity-40">
        {kinds.length === 1
          ? `Only ${wanted.toLowerCase()} are shown here — this field can't take anything else.`
          : 'Videos are marked in red; photos in grey.'}
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'mb-4 cursor-pointer rounded-2xl border border-dashed px-6 py-7 text-center transition-colors',
          dragging ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-white/20 hover:border-white/40'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          hidden
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <p className="text-sm opacity-70">
          {uploadMutation.isPending ? 'uploading…' : `Drop ${wanted.toLowerCase()} here, or click to choose`}
        </p>
        <p className="mt-1 text-xs opacity-40">images up to 10MB · video up to 100MB</p>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-rose/10 px-3 py-2 text-sm text-rose" role="alert">
          {error}
        </p>
      )}

      {canFilter && (
        <div className="mb-3 flex gap-1.5">
          {(['all', 'image', 'video'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-full px-3 py-1 text-xs capitalize transition-colors',
                filter === f
                  ? 'bg-[var(--accent)] text-[color:var(--bg)]'
                  : 'bg-white/5 opacity-60 hover:opacity-100'
              )}
            >
              {f === 'image' ? 'photos' : f === 'video' ? 'videos' : 'all'}
            </button>
          ))}
        </div>
      )}

      <div className="grid max-h-[42dvh] grid-cols-2 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square" />)
        ) : (
          shown.map((m) => {
            const picked = selectedUrls.includes(m.url);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onPick(m)}
                className={cn(
                  'group relative aspect-square overflow-hidden rounded-xl border-2 text-left transition-all duration-200',
                  picked
                    ? 'border-[var(--accent)]'
                    : 'border-transparent hover:border-white/40 hover:scale-[1.02]'
                )}
              >
                <Thumb asset={m} />
                <TypeBadge type={m.type} format={m.format} />

                {m.type === 'video' && (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm">
                      <Icon name="play" size={14} filled />
                    </span>
                  </span>
                )}

                {picked && (
                  <span className="pointer-events-none absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-[color:var(--bg)]">
                    <Icon name="check" size={11} strokeWidth={2.5} />
                  </span>
                )}

                <button
                  type="button"
                  aria-label="Delete media"
                  disabled={deleteMutation.isPending}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to delete this file?')) {
                      deleteMutation.mutate(m.id);
                    }
                  }}
                  className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/75 text-white opacity-0 transition-opacity hover:bg-[#c9566b] hover:text-white group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-50"
                >
                  <Icon name="trash" size={11} />
                </button>

                <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-5 pt-4 text-[0.6rem] text-white/70">
                  {m.type === 'video' && m.duration
                    ? prettyDuration(m.duration)
                    : prettyBytes(m.bytes)}
                </span>
              </button>
            );
          })
        )}
      </div>

      {!isLoading && !shown.length && (
        <p className="py-8 text-center text-sm opacity-40">
          {eligible.length === 0
            ? `No ${wanted.toLowerCase()} uploaded yet — drop one above.`
            : 'Nothing matches that filter.'}
        </p>
      )}
    </Modal>
  );
}

/** Single-slot variant for `video` / `photo` fields. */
export function SingleMediaPicker({
  value,
  onChange,
  label,
  accept,
}: {
  value?: MediaRef | null;
  onChange: (v: MediaRef | null) => void;
  label: string;
  accept?: string;
}) {
  return (
    <MediaPicker
      label={label}
      max={1}
      accept={accept}
      value={value ? [value] : []}
      onChange={(next) => onChange(next[0] ?? null)}
    />
  );
}
