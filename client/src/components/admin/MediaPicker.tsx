import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { api, errorMessage, mediaUrl } from '@/lib/api';
import type { ListResponse, MediaAsset, MediaRef } from '@/lib/types';
import { cn } from '@/lib/utils';
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

interface PickerProps {
  value: MediaRef[];
  onChange: (next: MediaRef[]) => void;
  /** 1 for a single photo/video field, higher for galleries. */
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
              className="group relative h-20 w-20 overflow-hidden rounded-xl border border-white/10"
            >
              {m.type === 'video' ? (
                <video src={mediaUrl(m.url)} className="h-full w-full object-cover" muted />
              ) : (
                <img
                  src={mediaUrl(m.url)}
                  alt={m.alt ?? ''}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              )}
              <button
                type="button"
                aria-label="Remove"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                ×
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {value.length < max && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/20 text-2xl opacity-50 transition-opacity hover:opacity-90"
          >
            +<span className="text-[0.6rem] uppercase tracking-wider">add</span>
          </button>
        )}
      </div>

      <MediaLibraryModal
        open={open}
        onClose={() => setOpen(false)}
        accept={accept}
        onPick={(asset) => {
          const ref = toRef(asset);
          if (max === 1) {
            onChange([ref]);
            setOpen(false);
            return;
          }
          if (!value.some((v) => v.url === ref.url)) onChange([...value, ref].slice(0, max));
        }}
      />
    </div>
  );
}

function MediaLibraryModal({
  open,
  onClose,
  onPick,
  accept,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (m: MediaAsset) => void;
  accept: string;
}) {
  const { data, isLoading } = useMediaLibrary();
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      uploaded.forEach(onPick);
    },
    onError: (err) => setError(errorMessage(err, 'That upload did not work')),
  });

  function handleFiles(list: FileList | null) {
    if (!list?.length) return;
    uploadMutation.mutate(Array.from(list));
  }

  return (
    <Modal open={open} onClose={onClose} className="max-w-3xl">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-display text-2xl">Media</h2>
        <button onClick={onClose} className="text-sm opacity-50 hover:opacity-90">
          done
        </button>
      </div>

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
          'mb-5 cursor-pointer rounded-2xl border border-dashed px-6 py-7 text-center transition-colors',
          dragging ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-white/20'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="text-sm opacity-70">
          {uploadMutation.isPending ? 'uploading…' : 'Drop files here, or click to choose'}
        </p>
        <p className="mt-1 text-xs opacity-40">images up to 10MB · video up to 100MB</p>
      </div>

      {error && <p className="mb-4 text-sm text-rose">{error}</p>}

      <div className="grid max-h-[45dvh] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-5">
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="aspect-square" />)
          : data?.items.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onPick(m)}
                className="aspect-square overflow-hidden rounded-lg border border-white/10 transition-transform hover:scale-[1.03]"
              >
                {m.type === 'video' ? (
                  <video src={mediaUrl(m.url)} className="h-full w-full object-cover" muted />
                ) : (
                  <img
                    src={mediaUrl(m.url)}
                    alt={m.alt ?? ''}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                )}
              </button>
            ))}
      </div>

      {!isLoading && !data?.items.length && (
        <p className="py-6 text-center text-sm opacity-40">Nothing uploaded yet.</p>
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
