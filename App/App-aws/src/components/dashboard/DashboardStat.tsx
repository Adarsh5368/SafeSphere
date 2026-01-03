import React from 'react';
import { cn } from '../../utils/helpers';

interface DashboardStatProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

const DashboardStat: React.FC<DashboardStatProps> = ({
  title,
  value,
  icon,
  description,
  trend,
  className
}) => {
  return (
    <div className={cn(
      'bg-surface rounded-xl border border-border-default p-5',
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-bodyFont font-medium text-muted">{title}</p>
          <p className="text-2xl font-themeFont font-semibold text-gray-900 mt-1">{value}</p>
          {description && (
            <p className="text-sm font-bodyFont text-muted mt-1">{description}</p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 ml-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <span className="text-primary">{icon}</span>
            </div>
          </div>
        )}
      </div>
      
      {trend && (
        <div className="mt-3 flex items-center gap-1">
          <span className={cn(
            'text-sm font-bodyFont font-medium',
            trend.isPositive ? 'text-success' : 'text-error'
          )}>
            {trend.isPositive ? '↗' : '↘'} {trend.value}
          </span>
          <span className="text-sm font-bodyFont text-muted">vs last week</span>
        </div>
      )}
    </div>
  );
};

export default DashboardStat;