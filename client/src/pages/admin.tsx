/**
 * Admin Page Component
 * 
 * Secret admin page for accessing the conversation dashboard.
 * Only accessible via the secret login code.
 */

import { AdminDashboard } from '@/components/admin/AdminDashboard';

export default function Admin() {
  return <AdminDashboard />;
}