import { ModuleUnderConstruction } from '@/components/module-under-construction';

export default function AdminPage() {
  return (
    <ModuleUnderConstruction
      title="Admin"
      description="User management, role configuration, data sources, and system settings."
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Admin' }]}
    />
  );
}
