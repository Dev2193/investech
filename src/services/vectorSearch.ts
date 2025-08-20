import { pipeline } from '@huggingface/transformers';

export interface SearchResult {
  score: number;
  [key: string]: any;
}

export interface DocumentMetadata {
  ticker?: string;
  date?: string;
  url?: string;
  published_at?: string;
  region?: string;
  [key: string]: any;
}

/**
 * Simple FAISS-like vector search using sentence transformers
 * Implements semantic search with embedding-based similarity
 */
export class SimpleFAISS {
  private indexDir: string;
  private modelName: string;
  private embedder: any = null;
  private embeddings: Float32Array[] = [];
  private metadata: DocumentMetadata[] = [];
  private initPromise: Promise<void> | null = null;

  constructor(indexDir: string, modelName: string = 'sentence-transformers/all-MiniLM-L6-v2') {
    this.indexDir = indexDir;
    this.modelName = modelName;
  }

  private async ensureEmbedder(): Promise<any> {
    if (this.embedder) return this.embedder;

    if (!this.initPromise) {
      this.initPromise = this.initEmbedder();
    }

    await this.initPromise;
    return this.embedder!;
  }

  private async initEmbedder(): Promise<void> {
    try {
      // Use feature extraction pipeline for embeddings
      this.embedder = await pipeline(
        'feature-extraction',
        this.modelName,
        { 
          device: 'webgpu',
          dtype: 'fp16'
        }
      );
    } catch (error) {
      console.warn('WebGPU not available for embeddings, falling back to CPU:', error);
      this.embedder = await pipeline('feature-extraction', this.modelName);
    }
  }

  /**
   * Build the index from texts and metadata
   */
  async build(texts: string[], metadatas: DocumentMetadata[]): Promise<void> {
    if (texts.length !== metadatas.length) {
      throw new Error('Texts and metadatas must have the same length');
    }

    const embedder = await this.ensureEmbedder();
    
    // Generate embeddings for all texts
    console.log(`Generating embeddings for ${texts.length} documents...`);
    this.embeddings = [];
    this.metadata = metadatas;

    // Process in batches to avoid memory issues
    const batchSize = 10;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchEmbeddings = await embedder(batch, { 
        pooling: 'mean', 
        normalize: true 
      });
      
      // Convert to Float32Array and store
      for (let j = 0; j < batch.length; j++) {
        const embedding = batchEmbeddings[j];
        this.embeddings.push(new Float32Array(embedding.data));
      }
      
      console.log(`Processed ${Math.min(i + batchSize, texts.length)}/${texts.length} documents`);
    }

    console.log(`Built index with ${this.embeddings.length} embeddings`);
  }

  /**
   * Save index to localStorage (browser equivalent of saving to disk)
   */
  save(): void {
    try {
      const indexData = {
        embeddings: this.embeddings.map(emb => Array.from(emb)),
        metadata: this.metadata,
        modelName: this.modelName,
        timestamp: Date.now()
      };

      localStorage.setItem(`faiss_index_${this.indexDir}`, JSON.stringify(indexData));
      console.log(`Saved index for ${this.indexDir} to localStorage`);
    } catch (error) {
      console.error('Failed to save index:', error);
    }
  }

  /**
   * Load index from localStorage
   */
  load(): boolean {
    try {
      const savedData = localStorage.getItem(`faiss_index_${this.indexDir}`);
      if (!savedData) {
        console.log(`No saved index found for ${this.indexDir}`);
        return false;
      }

      const indexData = JSON.parse(savedData);
      this.embeddings = indexData.embeddings.map((emb: number[]) => new Float32Array(emb));
      this.metadata = indexData.metadata;
      this.modelName = indexData.modelName;

      console.log(`Loaded index for ${this.indexDir} with ${this.embeddings.length} embeddings`);
      return true;
    } catch (error) {
      console.error('Failed to load index:', error);
      return false;
    }
  }

  /**
   * Search for similar documents using cosine similarity
   */
  async search(query: string, k: number = 5): Promise<SearchResult[]> {
    if (this.embeddings.length === 0) {
      console.warn('No embeddings available. Build or load an index first.');
      return [];
    }

    const embedder = await this.ensureEmbedder();
    
    // Generate query embedding
    const queryEmbedding = await embedder(query, { 
      pooling: 'mean', 
      normalize: true 
    });
    const queryVector = new Float32Array(queryEmbedding.data);

    // Calculate cosine similarity with all documents
    const similarities = this.embeddings.map((docEmbedding, index) => ({
      index,
      score: this.cosineSimilarity(queryVector, docEmbedding)
    }));

    // Sort by similarity score (descending)
    similarities.sort((a, b) => b.score - a.score);

    // Return top-k results with metadata
    const results: SearchResult[] = [];
    for (let i = 0; i < Math.min(k, similarities.length); i++) {
      const { index, score } = similarities[i];
      if (score > 0) { // Only return positive similarities
        results.push({
          ...this.metadata[index],
          score
        });
      }
    }

    return results;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Get the number of documents in the index
   */
  size(): number {
    return this.embeddings.length;
  }

  /**
   * Clear the index
   */
  clear(): void {
    this.embeddings = [];
    this.metadata = [];
    localStorage.removeItem(`faiss_index_${this.indexDir}`);
  }
}

/**
 * Utility function to create and manage document indexes
 */
export class DocumentIndexManager {
  private indexes: Map<string, SimpleFAISS> = new Map();

  /**
   * Get or create an index for a specific ticker
   */
  async getIndex(ticker: string): Promise<SimpleFAISS> {
    if (!this.indexes.has(ticker)) {
      const index = new SimpleFAISS(ticker);
      
      // Try to load existing index
      if (!index.load()) {
        console.log(`No existing index found for ${ticker}, will need to build new one`);
      }
      
      this.indexes.set(ticker, index);
    }

    return this.indexes.get(ticker)!;
  }

  /**
   * Build index from news articles for a ticker
   */
  async buildTickerIndex(
    ticker: string, 
    articles: Array<{
      text: string;
      published_at: string;
      url?: string;
      region?: string;
      date?: string;
    }>
  ): Promise<void> {
    const index = await this.getIndex(ticker);
    
    const texts = articles.map(article => article.text);
    const metadata = articles.map(article => ({
      ticker,
      published_at: article.published_at,
      date: article.date || new Date(article.published_at).toISOString().split('T')[0],
      url: article.url || '',
      region: article.region || 'US'
    }));

    await index.build(texts, metadata);
    index.save();
    
    console.log(`Built and saved index for ${ticker} with ${articles.length} articles`);
  }

  /**
   * Search across all ticker indexes
   */
  async searchAll(query: string, k: number = 5): Promise<SearchResult[]> {
    const allResults: SearchResult[] = [];
    
    for (const [ticker, index] of this.indexes) {
      if (index.size() > 0) {
        const results = await index.search(query, k);
        allResults.push(...results);
      }
    }

    // Sort all results by score and return top-k
    allResults.sort((a, b) => b.score - a.score);
    return allResults.slice(0, k);
  }
}

// Export singleton instance
export const documentIndexManager = new DocumentIndexManager();