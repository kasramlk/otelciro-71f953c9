import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdvancedAnalytics } from '@/components/social-media/AdvancedAnalytics';
import { AutomationRules } from '@/components/social-media/AutomationRules';
import { CompetitorAnalysis } from '@/components/social-media/CompetitorAnalysis';

const SocialMediaAdvanced: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analytics">Advanced Analytics</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
        </TabsList>
        
        <TabsContent value="analytics" className="space-y-6">
          <AdvancedAnalytics />
        </TabsContent>
        
        <TabsContent value="automation" className="space-y-6">
          <AutomationRules />
        </TabsContent>
        
        <TabsContent value="competitors" className="space-y-6">
          <CompetitorAnalysis />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SocialMediaAdvanced;