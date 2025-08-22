import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QATestSuite from '@/components/testing/QATestSuite';
import DeploymentChecklist from '@/components/production/DeploymentChecklist';

const QATestSuitePage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quality Assurance</h1>
        <p className="text-muted-foreground">Testing and deployment preparation</p>
      </div>
      
      <Tabs defaultValue="tests" className="w-full">
        <TabsList>
          <TabsTrigger value="tests">Test Suite</TabsTrigger>
          <TabsTrigger value="deployment">Deployment Checklist</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tests">
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