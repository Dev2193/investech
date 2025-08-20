import { DashboardHeader } from "@/components/DashboardHeader";
import { MetricCard } from "@/components/MetricCard";
import { SentimentChart } from "@/components/SentimentChart";
import { PredictionResults } from "@/components/PredictionResults";
import { FeatureImportance } from "@/components/FeatureImportance";
import { TrendingUp, TrendingDown, Activity, Users, Brain, Target } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <DashboardHeader />
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Overall Sentiment"
            value="68.4%"
            change="+2.3%"
            changeType="positive"
            icon={<TrendingUp className="h-6 w-6" />}
            description="Weighted sentiment score"
          />
          <MetricCard
            title="Prediction Accuracy"
            value="74.2%"
            change="+1.8%"
            changeType="positive"
            icon={<Target className="h-6 w-6" />}
            description="7-day rolling accuracy"
          />
          <MetricCard
            title="Active Signals"
            value="1,247"
            change="+156"
            changeType="positive"
            icon={<Activity className="h-6 w-6" />}
            description="Daily text signals processed"
          />
          <MetricCard
            title="Model Confidence"
            value="82.1%"
            change="-0.5%"
            changeType="negative"
            icon={<Brain className="h-6 w-6" />}
            description="Average prediction confidence"
          />
        </div>
        
        {/* Charts and Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SentimentChart />
          <PredictionResults />
        </div>
        
        {/* Feature Importance */}
        <div className="grid grid-cols-1 gap-6">
          <FeatureImportance />
        </div>
      </div>
    </div>
  );
};

export default Index;
