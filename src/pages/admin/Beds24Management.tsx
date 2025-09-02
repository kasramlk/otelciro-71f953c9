import React from 'react';
import { Beds24AdminSettings } from '@/components/admin/Beds24AdminSettings';
import { AdminLayout } from '@/layouts/AdminLayout';

const Beds24Management: React.FC = () => {
  return (
    <AdminLayout>
      <Beds24AdminSettings />
    </AdminLayout>
  );
};

export default Beds24Management;