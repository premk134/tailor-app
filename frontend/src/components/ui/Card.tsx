import { HTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = ({
  children,
  padding = 'md',
  shadow = 'md',
  className,
  ...props
}: CardProps) => {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const shadows = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  };

  return (
    <div
      className={clsx(
        'bg-white rounded-lg border border-gray-200',
        paddings[padding],
        shadows[shadow],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export const CardHeader = ({
  title,
  subtitle,
  actions,
  children,
  className,
  ...props
}: CardHeaderProps) => {
  return (
    <div className={clsx('flex items-start justify-between mb-4', className)} {...props}>
      <div>
        {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        {children}
      </div>
      {actions && <div className="flex-shrink-0 ml-4">{actions}</div>}
    </div>
  );
};

export const CardBody = ({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={clsx(className)} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={clsx('mt-4 pt-4 border-t border-gray-200', className)} {...props}>
      {children}
    </div>
  );
};
