import { supabase } from '../lib/supabase';
import { triggerVideoCreatedEvent } from './zapierWebhook';

export const MAX_VIDEOS_PER_USER = 10;

export interface VideoUploadData {
  videoName: string;
  videoBlob: Blob;
  script?: string;
  transcript?: string;
  aiScenes?: string[];
  duration?: number;
}

export const getVideoCount = async (): Promise<number> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated');
  }

  const { count, error } = await supabase
    .from('user_videos')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (error) throw error;

  return count || 0;
};

export const canUploadVideo = async (): Promise<boolean> => {
  const count = await getVideoCount();
  return count < MAX_VIDEOS_PER_USER;
};

export const uploadVideo = async (uploadData: VideoUploadData): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated');
  }

  const canUpload = await canUploadVideo();
  if (!canUpload) {
    throw new Error(`You have reached the maximum limit of ${MAX_VIDEOS_PER_USER} videos. Please delete some videos to upload new ones.`);
  }

  const fileName = `${Date.now()}_${uploadData.videoName.replace(/[^a-z0-9]/gi, '_')}.webm`;
  const filePath = `${user.id}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('videos')
    .upload(filePath, uploadData.videoBlob);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('videos')
    .getPublicUrl(filePath);

  const { error: insertError } = await supabase
    .from('user_videos')
    .insert({
      user_id: user.id,
      video_name: uploadData.videoName,
      video_url: publicUrl,
      script: uploadData.script,
      transcript: uploadData.transcript,
      ai_scenes: uploadData.aiScenes || [],
      duration: uploadData.duration,
      file_size: uploadData.videoBlob.size,
    });

  if (insertError) {
    await supabase.storage.from('videos').remove([filePath]);
    throw insertError;
  }

  await triggerVideoCreatedEvent({
    video_name: uploadData.videoName,
    video_url: publicUrl,
    duration: uploadData.duration,
    script: uploadData.script,
  });

  return publicUrl;
};

export const deleteOldestVideo = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated');
  }

  const { data: videos, error: fetchError } = await supabase
    .from('user_videos')
    .select('id, video_url')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1);

  if (fetchError) throw fetchError;

  if (videos && videos.length > 0) {
    const oldestVideo = videos[0];

    const filePath = oldestVideo.video_url.split('/').pop();
    if (filePath) {
      await supabase.storage
        .from('videos')
        .remove([`${user.id}/${filePath}`]);
    }

    const { error: deleteError } = await supabase
      .from('user_videos')
      .delete()
      .eq('id', oldestVideo.id);

    if (deleteError) throw deleteError;
  }
};
