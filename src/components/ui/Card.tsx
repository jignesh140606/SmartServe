import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export function Card({ className, hoverEffect = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-neutral-200/80 shadow-soft-sm text-neutral-800 transition-all duration-200',
        hoverEffect && 'hover:shadow-soft-md hover:border-neutral-300/90',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  border?: boolean;
}

export function CardHeader({ className, border = false, children, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn(
        'p-5 md:p-6 flex flex-col space-y-1.5',
        border && 'border-b border-neutral-100 pb-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-lg font-semibold leading-tight text-neutral-900 tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-neutral-500 leading-normal', className)} {...props}>
      {children}
    </p>
  );
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

export function CardContent({ className, noPadding = false, children, ...props }: CardContentProps) {
  return (
    <div className={cn(!noPadding && 'p-5 md:p-6 pt-0', className)} {...props}>
      {children}
    </div>
  );
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  border?: boolean;
}

export function CardFooter({ className, border = false, children, ...props }: CardFooterProps) {
  return (
    <div
      className={cn(
        'p-5 md:p-6 pt-0 flex items-center',
        border && 'border-t border-neutral-100 pt-4 mt-2',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
