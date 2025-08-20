import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Brain, Settings2, BarChart3 } from 'lucide-react';
import PredictForm from './PredictForm';
import ExplainForm from './ExplainForm';
import TrainForm from './TrainForm';
import Index from '@/pages/Index';

export default function Navigation() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            InvesTech.AI
          </h1>
          <p className="text-xl text-muted-foreground">
            AI-powered financial sentiment analysis and market prediction
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="predict" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Predict
            </TabsTrigger>
            <TabsTrigger value="explain" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Explain
            </TabsTrigger>
            <TabsTrigger value="train" className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Train
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Index />
          </TabsContent>

          <TabsContent value="predict">
            <PredictForm />
          </TabsContent>

          <TabsContent value="explain">
            <ExplainForm />
          </TabsContent>

          <TabsContent value="train">
            <TrainForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}