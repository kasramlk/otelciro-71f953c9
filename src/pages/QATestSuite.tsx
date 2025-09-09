import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QATestSuite from '@/components/testing/QATestSuite';
import EnhancedQATestSuite from '@/components/testing/EnhancedQATestSuite';
import EnhancedSecurityCenter from '@/components/security/EnhancedSecurityCenter';
import DeploymentChecklist from '@/components/production/DeploymentChecklist';

const QATestSuitePage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quality Assurance</h1>
        <p className="text-muted-foreground">Testing and deployment preparation</p>
      </div>
      
      <Tabs defaultValue="enhanced-tests" className="w-full">
        <TabsList>
          <TabsTrigger value="enhanced-tests">Enhanced HMS Tests</TabsTrigger>
          <TabsTrigger value="security">Security Center</TabsTrigger>
          <TabsTrigger value="basic-tests">Basic Test Suite</TabsTrigger>
          <TabsTrigger value="deployment">Deployment Checklist</TabsTrigger>
        </TabsList>
        
        <TabsContent value="enhanced-tests">
          <EnhancedQATestSuite />
        </TabsContent>
        
        <TabsContent value="security">
          <EnhancedSecurityCenter />
        </TabsContent>
        
        <TabsContent value="basic-tests">
          <QATestSuite />
        </TabsContent>
        
        <TabsContent value="deployment">
          <DeploymentChecklist />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QATestSuitePage;