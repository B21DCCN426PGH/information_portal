// Hàm chuyển đổi YouTube URL sang embed URL
const convertToEmbedUrl = (url) => {
  if (!url) return null;
  
  // Nếu đã là embed URL, trả về nguyên
  if (url.includes('/embed/')) {
    return url;
  }
  
  // Xử lý các format YouTube URL khác nhau
  let videoId = null;
  
  // Format: https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (watchMatch) {
    videoId = watchMatch[1];
  }
  
  // Format: https://www.youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/youtube\.com\/embed\/([^&\n?#]+)/);
  if (embedMatch) {
    videoId = embedMatch[1];
  }
  
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  
  // Nếu không phải YouTube URL, trả về nguyên
  return url;
};

export const VideoSection = ({ videoUrl }) => {
  const embedUrl = convertToEmbedUrl(videoUrl);
  
  return (
    <div className="overflow-hidden rounded-2xl shadow-lg">
      {embedUrl ? (
        <iframe
          src={embedUrl}
          title="Giới thiệu Khoa"
          className="h-80 w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <div className="flex h-80 items-center justify-center bg-slate-100 text-slate-500">
          Video giới thiệu sẽ hiển thị tại đây
        </div>
      )}
    </div>
  );
};


