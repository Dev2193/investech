import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts';

const mockShapData = [
  { feature: 'sent_mean', importance: 0.32, impact: 'positive', color: 'hsl(var(--success))' },
  { feature: 'events_pos', importance: 0.28, impact: 'positive', color: 'hsl(var(--success))' },
  { feature: 'momentum_5d', importance: 0.24, impact: 'negative', color: 'hsl(var(--destructive))' },
  { feature: 'volatility', importance: 0.19, impact: 'negative', color: 'hsl(var(--destructive))' },
  { feature: 'events_neg', importance: 0.16, impact: 'negative', color: 'hsl(var(--destructive))' },
  { feature: 'flow', importance: 0.14, impact: 'positive', color: 'hsl(var(--success))' },
  { feature: 'macro_index', importance: 0.11, impact: 'positive', color: 'hsl(var(--success))' },
  { feature: 'seasonality', importance: 0.08, impact: 'neutral', color: 'hsl(var(--muted-foreground))' },
];

export function FeatureImportance() {
  return (
    <Card className="p-6 bg-gradient-to-br from-card to-secondary/20 border-border/50 col-span-2">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">SHAP Feature Importance</h3>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-success"></div>
              <span className="text-muted-foreground">Positive Impact</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-destructive"></div>
              <span className="text-muted-foreground">Negative Impact</span>
            </div>
          </div>
        </div>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={mockShapData} 
              layout="horizontal"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                type="number"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                type="category"
                dataKey="feature"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                width={80}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
                formatter={(value: any) => [`${value.toFixed(3)}`, 'Importance']}
              />
              <Bar 
                dataKey="importance" 
                radius={[0, 4, 4, 0]}
              >
                {mockShapData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}