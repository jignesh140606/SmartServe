import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      id,
      disabled,
      required,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const textareaId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-medium text-neutral-700 tracking-wide select-none"
          >
            {label}
            {required && <span className="text-status-open ml-0.5">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          disabled={disabled}
          className={cn(
            'w-full rounded-lg bg-white border text-sm text-neutral-900 placeholder:text-neutral-400',
            'px-3.5 py-2.5 transition-colors duration-150 shadow-soft-xs resize-y',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600',
            'disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed disabled:border-neutral-200',
            error
              ? 'border-status-open-500 focus:border-status-open-500 focus:ring-status-open-500/20 text-status-open-text'
              : 'border-neutral-200 hover:border-neutral-300',
            className
          )}
          {...props}
        />

        {error ? (
          <p className="text-xs text-status-open-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-neutral-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
