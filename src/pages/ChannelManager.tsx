import React from 'react';
import { ChannelManagerDashboard } from '@/components/channel-manager/ChannelManagerDashboard';
import { HMSLayout } from '@/layouts/HMSLayout';

const ChannelManager: React.FC = () => {
  return (
    <HMSLayout>
      <ChannelManagerDashboard />
    </HMSLayout>
  );
};

export default ChannelManager;