import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

const mockSentimentData = [
  { date: '2024-01-15', sentiment: 0.65, volume: 234 },
  { date: '2024-01-16', sentiment: 0.72, volume: 189 },
  { date: '2024-01-17', sentiment: 0.58, volume: 356 },
  { date: '2024-01-18', sentiment: 0.81, volume: 298 },
  { date: '2024-01-19', sentiment: 0.45, volume: 412 },
  { date: '2024-01-22', sentiment: 0.67, volume: 324 },
  { date: '2024-01-23', sentiment: 0.74, volume: 278 },
];

export function SentimentChart() {
  return (
    <Card className="p-6 bg-gradient-to-br from-card to-secondary/20 border-border/50">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Daily Sentiment Signals</h3>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span className="text-muted-foreground">Weighted Sentiment</span>
            </div>
          </div>
        </div>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockSentimentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                domain={[0, 1]}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: any, name: string) => [
                  name === 'sentiment' ? `${(value * 100).toFixed(1)}%` : value,
                  name === 'sentiment' ? 'Sentiment Score' : 'Volume'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="sentiment" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}