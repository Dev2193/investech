import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  Server, 
  Database, 
  Brain, 
  BarChart3, 
  Search, 
  Globe, 
  Copy,
  CheckCircle,
  Terminal
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const pythonRequirements = [
  { name: 'fastapi', version: '0.115.0', category: 'Backend', icon: Server, description: 'High-performance web framework' },
  { name: 'uvicorn', version: '0.30.6', category: 'Backend', icon: Server, description: 'ASGI server implementation' },
  { name: 'pydantic', version: '2.9.2', category: 'Backend', icon: Package, description: 'Data validation framework' },
  { name: 'python-dotenv', version: '1.0.1', category: 'Backend', icon: Package, description: 'Environment configuration' },
  
  { name: 'pandas', version: '2.2.2', category: 'Data', icon: Database, description: 'Data manipulation and analysis' },
  { name: 'polars', version: '1.6.0', category: 'Data', icon: Database, description: 'Fast DataFrame library' },
  { name: 'numpy', version: '1.26.4', category: 'Data', icon: Database, description: 'Numerical computing' },
  
  { name: 'scikit-learn', version: '1.5.2', category: 'ML', icon: Brain, description: 'Machine learning toolkit' },
  { name: 'lightgbm', version: '4.5.0', category: 'ML', icon: Brain, description: 'Gradient boosting framework' },
  { name: 'xgboost', version: '2.1.1', category: 'ML', icon: Brain, description: 'Optimized distributed gradient boosting' },
  { name: 'shap', version: '0.46.0', category: 'ML', icon: BarChart3, description: 'Model explainability' },
  
  { name: 'transformers', version: '4.43.4', category: 'NLP', icon: Brain, description: 'State-of-the-art NLP models' },
  { name: 'torch', version: '≥2.2.0', category: 'NLP', icon: Brain, description: 'Deep learning framework' },
  { name: 'sentence-transformers', version: '3.0.1', category: 'NLP', icon: Search, description: 'Semantic similarity models' },
  { name: 'faiss-cpu', version: '1.8.0.post1', category: 'NLP', icon: Search, description: 'Vector similarity search' },
  
  { name: 'yfinance', version: '0.2.43', category: 'Data Sources', icon: Globe, description: 'Yahoo Finance API' },
  { name: 'requests', version: '2.32.3', category: 'Data Sources', icon: Globe, description: 'HTTP library' },
  { name: 'beautifulsoup4', version: '4.12.3', category: 'Data Sources', icon: Globe, description: 'Web scraping' },
  { name: 'feedparser', version: '6.0.11', category: 'Data Sources', icon: Globe, description: 'RSS/Atom feed parsing' },
  
  { name: 'tqdm', version: '4.66.5', category: 'Utils', icon: Package, description: 'Progress bars' },
  { name: 'python-dateutil', version: '2.9.0.post0', category: 'Utils', icon: Package, description: 'Date/time utilities' },
  { name: 'streamlit', version: '1.37.1', category: 'Frontend', icon: Package, description: 'Optional UI framework' }
];

const frontendStack = [
  { name: 'React', version: '18.3.1', description: 'UI framework' },
  { name: 'TypeScript', version: 'Latest', description: 'Type-safe JavaScript' },
  { name: 'Vite', version: 'Latest', description: 'Build tool' },
  { name: 'Tailwind CSS', version: 'Latest', description: 'Utility-first CSS' },
  { name: 'Supabase', version: 'Latest', description: 'Database & auth' },
  { name: 'Transformers.js', version: 'Latest', description: 'Client-side AI models' }
];

export function TechnicalRequirements() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const { toast } = useToast();

  const generateRequirementsTxt = () => {
    return pythonRequirements
      .map(req => `${req.name}==${req.version}`)
      .join('\n');
  };

  const copyToClipboard = async (content: string, section: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedSection(section);
      toast({
        title: "Copied to clipboard",
        description: `${section} requirements copied successfully`
      });
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const categoryColors = {
    'Backend': 'bg-blue-100 text-blue-800 border-blue-200',
    'Data': 'bg-green-100 text-green-800 border-green-200',
    'ML': 'bg-purple-100 text-purple-800 border-purple-200',
    'NLP': 'bg-pink-100 text-pink-800 border-pink-200',
    'Data Sources': 'bg-orange-100 text-orange-800 border-orange-200',
    'Utils': 'bg-gray-100 text-gray-800 border-gray-200',
    'Frontend': 'bg-cyan-100 text-cyan-800 border-cyan-200'
  };

  const categorizedRequirements = pythonRequirements.reduce((acc, req) => {
    if (!acc[req.category]) {
      acc[req.category] = [];
    }
    acc[req.category].push(req);
    return acc;
  }, {} as Record<string, typeof pythonRequirements>);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5" />
        <h2 className="text-2xl font-semibold">Technical Requirements</h2>
      </div>

      <Tabs defaultValue="python" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="python">Python Backend</TabsTrigger>
          <TabsTrigger value="frontend">Frontend Stack</TabsTrigger>
          <TabsTrigger value="install">Installation</TabsTrigger>
        </TabsList>

        <TabsContent value="python" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Python Dependencies
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generateRequirementsTxt(), 'requirements.txt')}
                  className="flex items-center gap-2"
                >
                  {copiedSection === 'requirements.txt' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  Copy requirements.txt
                </Button>
              </CardTitle>
              <CardDescription>
                Backend dependencies for the InvesTech.AI system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(categorizedRequirements).map(([category, requirements]) => (
                  <div key={category}>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      {requirements[0]?.icon && React.createElement(requirements[0].icon, { className: "h-4 w-4" })}
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {requirements.map((req) => (
                        <div key={req.name} className="p-3 border rounded-lg bg-muted/30">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{req.name}</span>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${categoryColors[req.category as keyof typeof categoryColors]}`}
                            >
                              {req.version}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{req.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="frontend" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Frontend Technology Stack
              </CardTitle>
              <CardDescription>
                Modern web technologies powering the dashboard interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {frontendStack.map((tech) => (
                  <div key={tech.name} className="p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{tech.name}</span>
                      <Badge variant="outline">{tech.version}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{tech.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="install" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Installation Guide
              </CardTitle>
              <CardDescription>
                Step-by-step setup for the InvesTech.AI system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">1. Environment Setup</h3>
                  <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                    <div>python -m venv .venv</div>
                    <div>source .venv/bin/activate  # Linux/Mac</div>
                    <div># or .venv\Scripts\activate  # Windows</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">2. Install Dependencies</h3>
                  <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                    <div>pip install -r requirements.txt</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">3. Configuration</h3>
                  <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                    <div>cp .env.example .env</div>
                    <div># Edit .env with your API keys</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">4. Train Models</h3>
                  <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                    <div>python app/train.py --ticker METROBRAND.NS --region IN</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">5. Run API Server</h3>
                  <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                    <div>uvicorn app.main:app --reload --port 8000</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">6. Optional: Streamlit UI</h3>
                  <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                    <div>streamlit run streamlit_app.py</div>
                    <div># Available at http://localhost:8501</div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">System Architecture</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-primary">Quant Brain (LightGBM)</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>Direction prediction (classification)</li>
                      <li>Return quantile regression</li>
                      <li>Technical feature engineering</li>
                      <li>SHAP explainability</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-primary">Language Brain (LLM + RAG)</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>FinBERT sentiment analysis</li>
                      <li>News event extraction</li>
                      <li>Vector similarity search</li>
                      <li>Region-weighted signals</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}