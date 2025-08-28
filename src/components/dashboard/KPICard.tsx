import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

export function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  className,
  variant = 'default'
}: KPICardProps) {
  return (
    <Card className={cn(
      "card-hover transition-smooth",
      variant === 'primary' && "border-primary/20 bg-primary-light",
      variant === 'success' && "border-success/20 bg-success-light", 
      variant === 'warning' && "border-warning/20 bg-warning-light",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{value}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
              {trend && (
                <div className={cn(
                  "flex items-center text-xs font-medium",
                  trend.isPositive ? "text-success" : "text-destructive"
                )}>
                  <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
                  <span className="ml-1 text-muted-foreground">vs mês anterior</span>
                </div>
              )}
            </div>
          </div>
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            variant === 'primary' && "bg-primary text-primary-foreground",
            variant === 'success' && "bg-success text-success-foreground",
            variant === 'warning' && "bg-warning text-warning-foreground",
            variant === 'default' && "bg-muted text-muted-foreground"
          )}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}