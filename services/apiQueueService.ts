import { supabase } from '../lib/supabase';
import {
  canMakeAPIRequest,
  incrementAPICounter,
  queueAPIRequest,
  getQueuedRequest,
  logAPIUsage
} from './apiUsageService';

export interface QueueOptions {
  priority?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export class APIRequestQueue {
  private static instance: APIRequestQueue;
  private isProcessing: boolean = false;
  private processingInterval: number | null = null;

  private constructor() {
    this.startProcessing();
  }

  static getInstance(): APIRequestQueue {
    if (!APIRequestQueue.instance) {
      APIRequestQueue.instance = new APIRequestQueue();
    }
    return APIRequestQueue.instance;
  }

  async makeRequest<T>(
    apiProvider: string,
    apiModel: string,
    requestFn: () => Promise<T>,
    requestType: string,
    options: QueueOptions = {}
  ): Promise<T> {
    const startTime = Date.now();
    const { priority = 5, maxRetries = 3 } = options;

    const canProceed = await canMakeAPIRequest(apiProvider, apiModel);

    if (!canProceed.allowed) {
      const queuedId = await queueAPIRequest(
        apiProvider,
        apiModel,
        { requestType, timestamp: new Date().toISOString() },
        priority
      );

      await logAPIUsage(apiProvider, apiModel, 'queued', requestType, 'queued', {
        metadata: {
          reason: canProceed.reason,
          retry_after: canProceed.retryAfter,
          queued_request_id: queuedId
        }
      });

      throw new Error(
        `API rate limit exceeded: ${canProceed.reason}. Request queued. ${
          canProceed.retryAfter ? `Retry after ${canProceed.retryAfter}s` : ''
        }`
      );
    }

    try {
      await incrementAPICounter(apiProvider, apiModel);

      const result = await requestFn();

      const responseTime = Date.now() - startTime;
      await logAPIUsage(apiProvider, apiModel, 'api_request', requestType, 'success', {
        responseTimeMs: responseTime
      });

      return result;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      const isRateLimitError =
        error?.message?.includes('quota') ||
        error?.message?.includes('rate limit') ||
        error?.message?.includes('429') ||
        error?.status === 'RESOURCE_EXHAUSTED';

      if (isRateLimitError) {
        const queuedId = await queueAPIRequest(
          apiProvider,
          apiModel,
          { requestType, timestamp: new Date().toISOString() },
          priority
        );

        await logAPIUsage(apiProvider, apiModel, 'api_request', requestType, 'rate_limited', {
          errorMessage: error.message,
          responseTimeMs: responseTime,
          metadata: { queued_request_id: queuedId }
        });

        throw new Error(
          `Rate limit exceeded. Your request has been queued and will be processed automatically when quota is available.`
        );
      }

      await logAPIUsage(apiProvider, apiModel, 'api_request', requestType, 'error', {
        errorMessage: error.message,
        responseTimeMs: responseTime
      });

      throw error;
    }
  }

  private startProcessing(): void {
    if (this.processingInterval) return;

    this.processingInterval = window.setInterval(() => {
      this.processQueue();
    }, 10000) as unknown as number;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      const { data: pendingRequests, error } = await supabase
        .from('api_request_queue')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_for', new Date().toISOString())
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(5);

      if (error || !pendingRequests || pendingRequests.length === 0) {
        return;
      }

      for (const request of pendingRequests) {
        const canProceed = await canMakeAPIRequest(
          request.api_provider,
          request.api_model
        );

        if (!canProceed.allowed) {
          const newScheduledTime = new Date(
            Date.now() + (canProceed.retryAfter || 60) * 1000
          ).toISOString();

          await supabase
            .from('api_request_queue')
            .update({
              scheduled_for: newScheduledTime,
              retry_count: request.retry_count + 1
            })
            .eq('id', request.id);

          continue;
        }

        await supabase
          .from('api_request_queue')
          .update({ status: 'processing' })
          .eq('id', request.id);
      }
    } catch (error) {
      console.error('Error processing queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  async getQueueStatus(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { pending: 0, processing: 0, completed: 0, failed: 0 };
      }

      const { data, error } = await supabase
        .from('api_request_queue')
        .select('status')
        .eq('user_id', user.id);

      if (error) throw error;

      const status = {
        pending: data?.filter(r => r.status === 'pending').length || 0,
        processing: data?.filter(r => r.status === 'processing').length || 0,
        completed: data?.filter(r => r.status === 'completed').length || 0,
        failed: data?.filter(r => r.status === 'failed').length || 0
      };

      return status;
    } catch (error) {
      console.error('Error getting queue status:', error);
      return { pending: 0, processing: 0, completed: 0, failed: 0 };
    }
  }

  async waitForQueuedRequest(
    requestId: string,
    timeout: number = 300000,
    pollInterval: number = 2000
  ): Promise<any> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          if (Date.now() - startTime > timeout) {
            reject(new Error('Request timeout'));
            return;
          }

          const request = await getQueuedRequest(requestId);

          if (!request) {
            reject(new Error('Request not found'));
            return;
          }

          if (request.status === 'completed') {
            resolve(request.result);
            return;
          }

          if (request.status === 'failed') {
            reject(new Error(request.error_message || 'Request failed'));
            return;
          }

          setTimeout(checkStatus, pollInterval);
        } catch (error) {
          reject(error);
        }
      };

      checkStatus();
    });
  }

  async cancelQueuedRequest(requestId: string): Promise<void> {
    try {
      await supabase
        .from('api_request_queue')
        .update({ status: 'cancelled' })
        .eq('id', requestId);
    } catch (error) {
      console.error('Error cancelling queued request:', error);
      throw error;
    }
  }
}

export const apiQueue = APIRequestQueue.getInstance();
