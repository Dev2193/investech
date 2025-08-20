import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, Brain, BarChart3 } from "lucide-react";

export function DashboardHeader() {
  return (
    <div className="relative overflow-hidden rounded-lg mb-8">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
      
      <div className="relative p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Financial Text Analytics
                </h1>
                <p className="text-muted-foreground">
                  AI-powered sentiment analysis and market prediction dashboard
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                <TrendingUp className="h-3 w-3 mr-1" />
                Model Active
              </Badge>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                <BarChart3 className="h-3 w-3 mr-1" />
                SHAP Enabled
              </Badge>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search ticker..." 
                  className="pl-10 w-64 bg-background/80 border-border/60"
                />
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                Analyze
              </Button>
            </div>
            
            <div className="text-right text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}