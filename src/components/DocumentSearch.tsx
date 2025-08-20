import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Search, FileText, Calendar, ExternalLink, Database, RefreshCw } from 'lucide-react';
import { documentIndexManager, type SearchResult } from '@/services/vectorSearch';
import { useToast } from '@/hooks/use-toast';

export function DocumentSearch() {
  const [query, setQuery] = useState('earnings growth retail expansion digital transformation');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [indexStats, setIndexStats] = useState<{ticker: string, count: number}[]>([]);
  const { toast } = useToast();

  // Mock financial news data for demonstration
  const mockNewsData = [
    {
      ticker: 'RELIANCE',
      text: 'Reliance Industries reported exceptional quarterly earnings with 23% YoY growth, driven by strong performance in digital services and retail expansion. The company added 50 new retail stores across tier-2 cities in India.',
      published_at: '2024-01-20T10:30:00Z',
      url: 'https://example.com/reliance-earnings-q4',
      region: 'IN'
    },
    {
      ticker: 'RELIANCE',
      text: 'Jio Platform witnesses surge in 5G subscriber base, crossing 100 million active users. Digital transformation initiatives show promising revenue growth across enterprise clients.',
      published_at: '2024-01-19T14:15:00Z',
      url: 'https://example.com/jio-5g-growth',
      region: 'IN'
    },
    {
      ticker: 'TCS',
      text: 'TCS announces strategic partnership with Microsoft for cloud migration services, expected to generate $2B revenue over next 3 years. Strong demand for digital transformation consulting continues.',
      published_at: '2024-01-18T11:20:00Z',
      url: 'https://example.com/tcs-microsoft-partnership',
      region: 'IN'
    },
    {
      ticker: 'TCS',
      text: 'Quarterly results show robust growth in North American markets with new client acquisitions in banking and financial services. Order book reaches all-time high of $8.1 billion.',
      published_at: '2024-01-17T16:30:00Z',
      url: 'https://example.com/tcs-q4-results',
      region: 'IN'
    },
    {
      ticker: 'INFY',
      text: 'Infosys reports strong margin expansion and operational efficiency improvements. AI and automation services contribute 15% to total revenue as companies accelerate digital initiatives.',
      published_at: '2024-01-16T13:45:00Z',
      url: 'https://example.com/infosys-margins',
      region: 'IN'
    },
    {
      ticker: 'INFY',
      text: 'Infosys Cobalt cloud platform gains traction with enterprise customers, contributing to 18% growth in cloud services revenue. Strategic focus on industry-specific solutions paying off.',
      published_at: '2024-01-15T09:15:00Z',
      url: 'https://example.com/infosys-cobalt-growth',
      region: 'IN'
    },
    {
      ticker: 'WIPRO',
      text: 'Wipro strengthens cybersecurity capabilities through acquisition of specialized consulting firm. Focus on zero-trust architecture and cloud security drives demand.',
      published_at: '2024-01-14T12:00:00Z',
      url: 'https://example.com/wipro-cybersecurity',
      region: 'IN'
    },
    {
      ticker: 'HDFC',
      text: 'HDFC Bank digital banking initiatives show strong adoption with 45% of transactions now happening through mobile platform. NII growth of 12% driven by improved asset quality.',
      published_at: '2024-01-13T10:45:00Z',
      url: 'https://example.com/hdfc-digital-banking',
      region: 'IN'
    }
  ];

  const buildIndexes = async () => {
    setIndexing(true);
    try {
      // Group articles by ticker
      const tickerGroups = mockNewsData.reduce((acc, article) => {
        if (!acc[article.ticker]) {
          acc[article.ticker] = [];
        }
        acc[article.ticker].push(article);
        return acc;
      }, {} as Record<string, typeof mockNewsData>);

      // Build indexes for each ticker
      for (const [ticker, articles] of Object.entries(tickerGroups)) {
        await documentIndexManager.buildTickerIndex(ticker, articles);
      }

      // Update index stats
      const stats = Object.entries(tickerGroups).map(([ticker, articles]) => ({
        ticker,
        count: articles.length
      }));
      setIndexStats(stats);

      toast({
        title: "Indexes Built Successfully",
        description: `Created semantic search indexes for ${Object.keys(tickerGroups).length} tickers`
      });
    } catch (error) {
      console.error('Error building indexes:', error);
      toast({
        title: "Error",
        description: "Failed to build search indexes",
        variant: "destructive"
      });
    } finally {
      setIndexing(false);
    }
  };

  const performSearch = async () => {
    if (!query.trim()) {
      toast({
        title: "Error",
        description: "Please enter a search query",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const searchResults = await documentIndexManager.searchAll(query, 8);
      setResults(searchResults);
      
      toast({
        title: "Search Complete",
        description: `Found ${searchResults.length} relevant documents`
      });
    } catch (error) {
      console.error('Error performing search:', error);
      toast({
        title: "Error",
        description: "Failed to perform semantic search",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Build indexes on component mount
  useEffect(() => {
    buildIndexes();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getScoreColor = (score: number) => {
    if (score > 0.8) return 'text-green-600';
    if (score > 0.6) return 'text-blue-600';
    if (score > 0.4) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Semantic Document Search (RAG)
          </CardTitle>
          <CardDescription>
            Vector-based news retrieval with sentence transformers for contextual explanations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter search query (e.g., 'earnings growth digital transformation')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && performSearch()}
            />
            <Button onClick={performSearch} disabled={loading || indexing}>
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </Button>
          </div>

          {/* Index Statistics */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Database className="h-4 w-4" />
              <span>Indexes: {indexStats.length} tickers</span>
            </div>
            <div>
              Documents: {indexStats.reduce((sum, stat) => sum + stat.count, 0)}
            </div>
            {indexing && (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Building embeddings...</span>
              </div>
            )}
          </div>

          {/* Index Status */}
          {indexStats.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {indexStats.map(({ ticker, count }) => (
                <Badge key={ticker} variant="outline" className="justify-center">
                  {ticker}: {count}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Search Results ({results.length})
            </CardTitle>
            <CardDescription>
              Documents ranked by semantic similarity score
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="p-4 border rounded-lg bg-muted/30 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {result.ticker}
                    </Badge>
                    <Badge variant="outline">
                      {result.region}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(result.published_at || result.date || '')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${getScoreColor(result.score)}`}>
                      {(result.score * 100).toFixed(1)}%
                    </span>
                    <Progress 
                      value={result.score * 100} 
                      className="w-16 h-2"
                    />
                  </div>
                </div>
                
                <p className="text-sm leading-relaxed">
                  {/* This would be the actual article text in a real implementation */}
                  {mockNewsData.find(article => 
                    article.ticker === result.ticker && 
                    article.published_at === result.published_at
                  )?.text || 'Article content not available'}
                </p>
                
                {result.url && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ExternalLink className="h-3 w-3" />
                    <span className="truncate">{result.url}</span>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {!loading && !indexing && results.length === 0 && query && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No documents found for your search query. Try different keywords.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}