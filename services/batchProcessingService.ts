import { CampaignRecipient } from './campaignService';
import { PersonalizationEngine, PersonalizedContent } from './personalizationEngine';
import { supabase } from '../lib/supabase';

export interface BatchProcessingOptions {
  campaignId: string;
  recipients: CampaignRecipient[];
  tier: 'basic' | 'smart' | 'advanced';
  scriptTemplate: string;
  visualStyle: string;
  masterVideoBlob?: Blob;
  onProgress?: (progress: BatchProgress) => void;
  onRecipientComplete?: (recipient: CampaignRecipient, result: ProcessingResult) => void;
  onError?: (recipient: CampaignRecipient, error: Error) => void;
}

export interface BatchProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  estimatedTimeRemaining: number;
  currentRecipient?: string;
}

export interface ProcessingResult {
  recipientId: string;
  success: boolean;
  videoUrl?: string;
  personalizedContent?: PersonalizedContent;
  cost: number;
  processingTime: number;
  error?: string;
}

export class BatchProcessor {
  private engine: PersonalizationEngine;
  private isProcessing: boolean = false;
  private isPaused: boolean = false;

  constructor(apiKey: string) {
    this.engine = new PersonalizationEngine(apiKey);
  }

  async processRecipient(
    recipient: CampaignRecipient,
    tier: 'basic' | 'smart' | 'advanced',
    scriptTemplate: string,
    visualStyle: string,
    masterVideoBlob?: Blob
  ): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
      await this.updateRecipientStatus(recipient.id, 'processing');

      const personalizedContent = await this.engine.personalizeForRecipient(
        recipient,
        tier,
        scriptTemplate,
        visualStyle
      );

      const processingTime = Date.now() - startTime;
      const cost = this.engine.getTierCost(tier);

      let videoUrl = masterVideoBlob ? URL.createObjectURL(masterVideoBlob) : undefined;

      await this.updateRecipientStatus(recipient.id, 'ready', {
        personalized_video_url: videoUrl,
        generation_cost: cost,
        processing_time_ms: processingTime,
        custom_fields: {
          ...recipient.custom_fields,
          personalizedContent,
        },
      });

      return {
        recipientId: recipient.id,
        success: true,
        videoUrl,
        personalizedContent,
        cost,
        processingTime,
      };
    } catch (error: any) {
      const processingTime = Date.now() - startTime;

      await this.updateRecipientStatus(recipient.id, 'failed', {
        processing_time_ms: processingTime,
      });

      return {
        recipientId: recipient.id,
        success: false,
        cost: 0,
        processingTime,
        error: error.message,
      };
    }
  }

  async processBatch(options: BatchProcessingOptions): Promise<ProcessingResult[]> {
    this.isProcessing = true;
    this.isPaused = false;

    const { recipients, tier, scriptTemplate, visualStyle, masterVideoBlob, onProgress, onRecipientComplete, onError } = options;

    const results: ProcessingResult[] = [];
    const startTime = Date.now();

    for (let i = 0; i < recipients.length; i++) {
      if (!this.isProcessing) break;

      while (this.isPaused) {
        await this.sleep(1000);
      }

      const recipient = recipients[i];

      const progress: BatchProgress = {
        total: recipients.length,
        completed: i,
        failed: results.filter(r => !r.success).length,
        inProgress: 1,
        estimatedTimeRemaining: this.calculateEstimatedTime(
          recipients.length - i,
          Date.now() - startTime,
          i
        ),
        currentRecipient: recipient.recipient_name,
      };

      if (onProgress) {
        onProgress(progress);
      }

      try {
        const result = await this.processRecipient(
          recipient,
          tier,
          scriptTemplate,
          visualStyle,
          masterVideoBlob
        );

        results.push(result);

        if (onRecipientComplete) {
          onRecipientComplete(recipient, result);
        }
      } catch (error: any) {
        const failedResult: ProcessingResult = {
          recipientId: recipient.id,
          success: false,
          cost: 0,
          processingTime: 0,
          error: error.message,
        };
        results.push(failedResult);

        if (onError) {
          onError(recipient, error);
        }
      }
    }

    this.isProcessing = false;

    const finalProgress: BatchProgress = {
      total: recipients.length,
      completed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      inProgress: 0,
      estimatedTimeRemaining: 0,
    };

    if (onProgress) {
      onProgress(finalProgress);
    }

    return results;
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  stop(): void {
    this.isProcessing = false;
    this.isPaused = false;
  }

  isRunning(): boolean {
    return this.isProcessing;
  }

  private async updateRecipientStatus(
    recipientId: string,
    status: CampaignRecipient['status'],
    additionalData?: Partial<CampaignRecipient>
  ): Promise<void> {
    const { error } = await supabase
      .from('campaign_recipients')
      .update({
        status,
        ...additionalData,
      })
      .eq('id', recipientId);

    if (error) {
      console.error('Failed to update recipient status:', error);
    }
  }

  private calculateEstimatedTime(remaining: number, elapsed: number, completed: number): number {
    if (completed === 0) return 0;
    const avgTimePerRecipient = elapsed / completed;
    return Math.ceil((remaining * avgTimePerRecipient) / 1000);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const createBatchProcessor = (apiKey: string): BatchProcessor => {
  return new BatchProcessor(apiKey);
};

export const retryFailed = async (
  campaignId: string,
  apiKey: string,
  tier: 'basic' | 'smart' | 'advanced',
  scriptTemplate: string,
  visualStyle: string,
  masterVideoBlob?: Blob
): Promise<ProcessingResult[]> => {
  const { data: failedRecipients } = await supabase
    .from('campaign_recipients')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('status', 'failed');

  if (!failedRecipients || failedRecipients.length === 0) {
    return [];
  }

  const processor = new BatchProcessor(apiKey);
  return processor.processBatch({
    campaignId,
    recipients: failedRecipients,
    tier,
    scriptTemplate,
    visualStyle,
    masterVideoBlob,
  });
};
