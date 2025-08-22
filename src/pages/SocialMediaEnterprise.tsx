import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PerformanceMonitoring } from '@/components/social-media/PerformanceMonitoring';
import { SecurityCenter } from '@/components/social-media/SecurityCenter';
import { EnterpriseReporting } from '@/components/social-media/EnterpriseReporting';

const SocialMediaEnterprise: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="reporting">Reporting</TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance" className="space-y-6">
          <PerformanceMonitoring />
        </TabsContent>
        
        <TabsContent value="security" className="space-y-6">
          <SecurityCenter />
        </TabsContent>
        
        <TabsContent value="reporting" className="space-y-6">
          <EnterpriseReporting />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SocialMediaEnterprise;