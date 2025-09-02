import React from 'react';
import { Beds24Dashboard } from '@/components/beds24/Beds24Dashboard';
import { HMSLayout } from '@/layouts/HMSLayout';

const Beds24Integration: React.FC = () => {
  return (
    <HMSLayout>
      <Beds24Dashboard />
    </HMSLayout>
  );
};

export default Beds24Integration;