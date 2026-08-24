import { PageHeader } from '@/components/page-header';
import { IndiaMapPlaceholder } from '@/components/india-map-placeholder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { stateRiskData, projects } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { RISK_BAND_LABEL } from '@/lib/risk';
import { MapPin, Layers, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MapPage() {
  return (
    <div className="flex flex-col">
      <PageHeader
        title="Risk Map"
        description="Geographic overview of project risk across India"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Map' }]}
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Filter className="h-3.5 w-3.5" /> Filters
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Layers className="h-3.5 w-3.5" /> Layers
            </Button>
          </>
        }
      />
      <div className="space-y-5 p-6">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <MapPin className="h-4 w-4" />
                India — project risk overlay
              </CardTitle>
            </CardHeader>
            <CardContent>
              <IndiaMapPlaceholder states={stateRiskData} className="min-h-[420px]" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                State risk index
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 px-3 pb-3 pt-0">
              {[...stateRiskData]
                .sort((a, b) => b.avgRisk - a.avgRisk)
                .map((s) => (
                  <div
                    key={s.state}
                    className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/40"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn('h-2.5 w-2.5 rounded-full', {
                          'bg-risk-low': s.band === 'low',
                          'bg-risk-moderate': s.band === 'moderate',
                          'bg-risk-high': s.band === 'high',
                          'bg-risk-critical': s.band === 'critical',
                        })}
                      />
                      <span className="text-sm font-medium text-foreground">{s.state}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {s.projects} proj
                      </span>
                      <span className="font-mono text-sm font-semibold text-foreground">
                        {s.avgRisk}
                      </span>
                      <span className="w-16 text-right text-[11px] text-muted-foreground">
                        {RISK_BAND_LABEL[s.band]}
                      </span>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Project locations ({projects.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5"
                >
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {p.district}, {p.state}
                    </p>
                  </div>
                  <span
                    className={cn('h-2.5 w-2.5 shrink-0 rounded-full', {
                      'bg-risk-low': p.riskBand === 'low',
                      'bg-risk-moderate': p.riskBand === 'moderate',
                      'bg-risk-high': p.riskBand === 'high',
                      'bg-risk-critical': p.riskBand === 'critical',
                    })}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
