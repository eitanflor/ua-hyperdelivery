import { useId } from "react";
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

const CONTROL = cn(
  "w-full rounded-sm border border-line bg-surface px-3 py-2 text-xs text-fg",
  "placeholder:text-fg-subtle transition-colors duration-150",
  "hover:border-line-strong focus:border-accent focus:outline-none",
  "disabled:opacity-50",
);

function Wrapper({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-2xs font-medium text-fg-muted">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-msg`} className="text-2xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-msg`} className="text-2xs text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  hint?: string;
  error?: string;
}

/** Always renders a real `<label>`. There is no placeholder-as-label path on purpose. */
export function TextInput({ label, hint, error, className, ...rest }: TextInputProps) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? `${id}-msg` : undefined}
        className={cn(CONTROL, error && "border-danger", className)}
        {...rest}
      />
    </Wrapper>
  );
}

interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {
  label: string;
  hint?: string;
  error?: string;
}

export function TextArea({ label, hint, error, className, ...rest }: TextAreaProps) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} hint={hint} error={error}>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? `${id}-msg` : undefined}
        className={cn(CONTROL, "resize-none", error && "border-danger", className)}
        {...rest}
      />
    </Wrapper>
  );
}
