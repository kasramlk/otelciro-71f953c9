import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IntegrationHub } from '@/components/social-media/IntegrationHub';
import { TeamCollaboration } from '@/components/social-media/TeamCollaboration';
import { ContentWorkflow } from '@/components/social-media/ContentWorkflow';

const SocialMediaIntegration: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>
        
        <TabsContent value="integrations" className="space-y-6">
          <IntegrationHub />
        </TabsContent>
        
        <TabsContent value="workflows" className="space-y-6">
          <ContentWorkflow />
        </TabsContent>
        
        <TabsContent value="team" className="space-y-6">
          <TeamCollaboration />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SocialMediaIntegration;