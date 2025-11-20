import React, { useState, useEffect } from 'react';
import { supabase, UserVideo } from '../lib/supabase';

interface VideoLibraryProps {
  onClose: () => void;
  onSelectVideo?: (video: UserVideo) => void;
}

export const VideoLibrary: React.FC<VideoLibraryProps> = ({ onClose, onSelectVideo }) => {
  const [videos, setVideos] = useState<UserVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('Please sign in to view your videos');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('user_videos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setVideos(data || []);
    } catch (err: any) {
      console.error('Error loading videos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVideo = async (videoId: string, videoUrl: string) => {
    if (!confirm('Are you sure you want to delete this video?')) {
      return;
    }

    setDeleting(videoId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const filePath = videoUrl.split('/').pop();
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('videos')
          .remove([`${user.id}/${filePath}`]);

        if (storageError) console.error('Error deleting file:', storageError);
      }

      const { error: deleteError } = await supabase
        .from('user_videos')
        .delete()
        .eq('id', videoId);

      if (deleteError) throw deleteError;

      setVideos(videos.filter(v => v.id !== videoId));
    } catch (err: any) {
      console.error('Error deleting video:', err);
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-800 p-8 rounded-lg max-w-4xl w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-gray-800 p-8 rounded-lg max-w-4xl w-full mx-4 my-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Video Library</h2>
            <p className="text-sm text-gray-400 mt-1">
              {videos.length} of 10 videos stored
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
            aria-label="Close video library"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {videos.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg">No videos saved yet</p>
            <p className="text-sm mt-2">Record and save videos to see them here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {videos.map((video) => (
              <div
                key={video.id}
                className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors"
              >
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.video_name}
                    className="w-full h-32 object-cover"
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-700 flex items-center justify-center">
                    <span className="text-gray-500">No thumbnail</span>
                  </div>
                )}

                <div className="p-4">
                  <h3 className="font-semibold text-white truncate">{video.video_name}</h3>
                  <div className="text-xs text-gray-400 mt-2 space-y-1">
                    <p>Duration: {formatDuration(video.duration)}</p>
                    <p>Size: {formatFileSize(video.file_size)}</p>
                    <p>Created: {new Date(video.created_at).toLocaleDateString()}</p>
                  </div>

                  <div className="flex gap-2 mt-4">
                    {onSelectVideo && (
                      <button
                        onClick={() => onSelectVideo(video)}
                        className="flex-1 px-3 py-2 bg-yellow-500 text-black text-sm font-semibold rounded-lg hover:bg-yellow-400"
                      >
                        Use
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteVideo(video.id, video.video_url)}
                      disabled={deleting === video.id}
                      className="flex-1 px-3 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-500 disabled:opacity-50"
                    >
                      {deleting === video.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 rounded-lg hover:bg-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
