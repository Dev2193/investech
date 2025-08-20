import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Brain, TrendingUp, Globe, BookOpen } from 'lucide-react';
import heroImage from '@/assets/dashboard-hero.jpg';

export function DashboardHeader() {
  return (
    <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-primary/10 via-primary/5 to-background">
      <div className="absolute inset-0 bg-grid-white/10" />
      <div className="relative">
        <div className="mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <span>Region-Aware Forecasting System</span>
                </div>
                <h1 className="text-4xl font-bold tracking-tight">
                  LLM Market Forecaster
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Advanced stock forecasting with dual-brain architecture: 
                  <span className="font-semibold text-primary"> Quant Brain</span> (LightGBM) + 
                  <span className="font-semibold text-primary"> Language Brain</span> (LLM + RAG)
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  SHAP Explainability
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Quantile Regression
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  India-First Weighting
                </Badge>
              </div>

              {/* Educational Disclaimer */}
              <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        Educational Use Only
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        This system is for research and educational purposes. Not investment advice. 
                        Use licensed data and comply with all source Terms of Service.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>FastAPI Backend</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>•</span>
                  <span>FinBERT Sentiment</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>•</span>
                  <span>Vector RAG</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                <img 
                  src={heroImage} 
                  alt="Financial forecasting dashboard visualization"
                  className="w-full h-full object-cover mix-blend-overlay opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
              </div>
              
              {/* Floating feature cards */}
              <div className="absolute -bottom-2 -left-2 bg-card/90 backdrop-blur border rounded-lg p-3 shadow-lg">
                <div className="text-xs text-muted-foreground">Model Confidence</div>
                <div className="text-lg font-bold text-primary">84.2%</div>
              </div>
              
              <div className="absolute -top-2 -right-2 bg-card/90 backdrop-blur border rounded-lg p-3 shadow-lg">
                <div className="text-xs text-muted-foreground">Region Boost</div>
                <div className="text-lg font-bold text-primary">1.5x IN</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}