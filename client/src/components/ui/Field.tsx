import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

const shell =
  'w-full rounded-xl bg-[color-mix(in_srgb,var(--fg)_6%,transparent)] px-4 py-2.5 ' +
  'border border-[color-mix(in_srgb,var(--fg)_14%,transparent)] ' +
  'placeholder:opacity-40 outline-none transition-colors duration-200 ' +
  'focus:border-[var(--accent)] disabled:opacity-50';

interface WrapProps {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}

export function FieldShell({ label, hint, error, children, htmlFor, className }: WrapProps) {
  return (
    <label className={cn('block space-y-1.5', className)} htmlFor={htmlFor}>
      {label && (
        <span className="block text-[0.72rem] font-medium uppercase tracking-[0.14em] opacity-55">
          {label}
        </span>
      )}
      {children}
      {error ? (
        <span className="block text-sm text-rose">{error}</span>
      ) : hint ? (
        <span className="block text-sm opacity-45">{hint}</span>
      ) : null}
    </label>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className, ...props },
  ref
) {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} error={error} htmlFor={id}>
      <input ref={ref} id={id} className={cn(shell, className)} {...props} />
    </FieldShell>
  );
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, rows = 4, ...props },
  ref
) {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} error={error} htmlFor={id}>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        className={cn(shell, 'resize-y leading-relaxed', className)}
        {...props}
      />
    </FieldShell>
  );
});

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
  options: { value: string; label: string }[];
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, options, className, ...props },
  ref
) {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} error={error} htmlFor={id}>
      <select ref={ref} id={id} className={cn(shell, 'appearance-none', className)} {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#17131f] text-[#efe6dc]">
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
});

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 py-1"
    >
      <span
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors duration-200',
          checked
            ? 'bg-[var(--accent)]'
            : 'bg-[color-mix(in_srgb,var(--fg)_18%,transparent)]'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-[var(--bg)] transition-transform duration-200 ease-soft',
            checked ? 'translate-x-[1.4rem]' : 'translate-x-0.5'
          )}
        />
      </span>
      <span className="text-sm">{label}</span>
    </button>
  );
}
