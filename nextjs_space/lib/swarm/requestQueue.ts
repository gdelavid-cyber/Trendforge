export type RequestPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface QueuedRequest<T = any> {
  id: string;
  priority: RequestPriority;
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
  retries: number;
  maxRetries: number;
  addedAt: number;
  metadata?: Record<string, any>;
}

const PRIORITY_SCORES: Record<RequestPriority, number> = {
  CRITICAL: 400, // Revenue-producing, buyer waiting, escrow release
  HIGH: 300,     // Time-sensitive, dispute handling, build blocking
  MEDIUM: 200,   // Quality gate, listing, outreach
  LOW: 100,      // Background discovery, strategy review
};

export class PriorityRequestQueue {
  private queue: QueuedRequest[] = [];
  private activeRequests: number = 0;
  private maxConcurrent: number = 20; // OpenRouter safe limit
  private rateLimitBackoff: number = 1000;
  private isProcessing: boolean = false;

  constructor(maxConcurrent = 20) {
    this.maxConcurrent = maxConcurrent;
  }

  async enqueue<T>(
    execute: () => Promise<T>,
    priority: RequestPriority = 'MEDIUM',
    metadata?: Record<string, any>
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const request: QueuedRequest<T> = {
        id: 'req_' + Math.random().toString(36).substring(2, 9),
        priority,
        execute,
        resolve,
        reject,
        retries: 0,
        maxRetries: 3,
        addedAt: Date.now(),
        metadata,
      };

      this.insertSorted(request);
      this.process();
    });
  }

  private insertSorted(request: QueuedRequest) {
    // Highest score first, then FIFO by addedAt
    let inserted = false;
    for (let i = 0; i < this.queue.length; i++) {
      const currentScore = PRIORITY_SCORES[this.queue[i].priority];
      const newScore = PRIORITY_SCORES[request.priority];
      if (newScore > currentScore) {
        this.queue.splice(i, 0, request);
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      this.queue.push(request);
    }
  }

  private async process(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.activeRequests < this.maxConcurrent && this.queue.length > 0) {
      const request = this.queue.shift();
      if (!request) break;

      this.activeRequests++;

      (async () => {
        try {
          const result = await request.execute();
          request.resolve(result);
          if (this.rateLimitBackoff > 1000) {
            this.rateLimitBackoff = Math.max(1000, this.rateLimitBackoff / 1.2);
          }
        } catch (error: any) {
          if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('Rate limit')) {
            // Rate limited — requeue with exponential backoff
            if (request.retries < request.maxRetries) {
              request.retries++;
              const delay = this.rateLimitBackoff * Math.pow(2, request.retries);
              this.rateLimitBackoff = Math.min(30000, this.rateLimitBackoff * 1.5);
              console.warn(`[RequestQueue] 429 Rate limit hit. Requeueing ${request.id} in ${delay}ms`);
              setTimeout(() => {
                this.insertSorted(request);
                this.process();
              }, delay);
            } else {
              request.reject(new Error(`Rate limit exceeded after ${request.maxRetries} retries`));
            }
          } else {
            request.reject(error);
          }
        } finally {
          this.activeRequests--;
          this.isProcessing = false;
          this.process();
        }
      })();
    }

    this.isProcessing = false;
  }

  getStats() {
    return {
      activeRequests: this.activeRequests,
      queuedRequests: this.queue.length,
      maxConcurrent: this.maxConcurrent,
      rateLimitBackoff: this.rateLimitBackoff,
    };
  }
}

export const requestQueue = new PriorityRequestQueue(20);
