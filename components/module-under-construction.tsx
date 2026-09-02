import { cn } from '@/lib/utils';
import { Construction } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import type { BreadcrumbItem } from '@/components/page-header';

interface ModuleUnderConstructionProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
}

export function ModuleUnderConstruction({
  title,
  description,
  breadcrumbs,
  className,
}: ModuleUnderConstructionProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
      />
      <div className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="flex max-w-md flex-col items-center rounded-md border border-dashed border-border bg-card/50 px-8 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Construction className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-base font-semibold text-foreground">
            Module under construction
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This module is part of the InfraSight AI roadmap and has not been
            implemented yet. The application foundation and shared components are
            in place and ready for it to be built on.
          </p>
        </div>
      </div>
    </div>
  );
}
