import { useCallback, useEffect, useState, useRef } from "react";
import { DELETE, getToken, POST } from "../components/Requests";
import { HandleLogin } from "../components/Auth";
import { Fullscreen, Pause, Play, ScreenShareOff, Upload, Video, Volume2, VolumeX, X } from "lucide-react";
import { UPLOAD } from "../components/UI/video/Upload"; 
import { PLAYLIST } from "../components/UI/video/Playlist"; 

interface VideoItem {
  id: number;
  title: string;
  url: string;
  compressed_url: string;
  description?: string;
  thumbnail_url?: string;
  thumbnail?: string;
  author_id: number;
  create_at: string;
}

// Define base API URL to avoid hardcoding
const API_BASE_URL = import.meta.env.VITE_SERVER_URL;

export const VIDEOS = () => {
  // UI states
  const [activeTab, setActiveTab] = useState<"upload" | "library" | "playlist">("upload");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Video playback states
  const [streamedVideo, setStreamedVideo] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Data states
  const [allVideos, setAllVideos] = useState<VideoItem[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  const [videoQuality, setVideoQuality] = useState<"high" | "low">("high");

  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const [showControls, setShowControls] = useState(true);
  const controlTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper function to construct full URL paths
  const getFullPath = (path: string) => {
    if (!path) return "";
    return path.startsWith("http") ? path : `${API_BASE_URL}/${path}`;
  };

  const fetchVideoStream = useCallback(async (video: VideoItem) => {
    if (!video) return;

    setIsLoading(true);

    try {
      let authToken = await getToken();

      if (!authToken) {
        await HandleLogin();
        authToken = await getToken();

        if (!authToken) {
          throw new Error("Unable to retrieve token after login.");
        }
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      };

      // Use the appropriate URL based on quality setting
      const videoUrl = videoQuality === "high" ? video.url : video.compressed_url;

      if (!videoUrl) {
        throw new Error("Video URL is not available");
      }

      const response = await fetch(`${API_BASE_URL}/api/stream-video/${videoUrl}`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch video stream: ${response.status}`);
      }

      const data = await response.json();

      if (data.url) {
        setStreamedVideo(data.url);
        console.log(data.url)
        setIsPlaying(true);
      } else {
        throw new Error("No video URL returned from server");
      }
    } catch (error) {
      console.error("Error fetching video stream:", error);
    } finally {
      setIsLoading(false);
    }
  }, [videoQuality]);

  const handleVideosFetching = useCallback(async () => {
    setIsLoading(true);

    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        throw new Error("User ID not found. Please log in again.");
      }

      const response = await POST("api/fetch-videos", { author_id: Number(userId) });

      if (response?.videos && Array.isArray(response.videos)) {
        setAllVideos(response.videos);

        // If we have videos and none is selected yet, select the first one
        if (response.videos.length > 0 && !selectedVideo) {
          setSelectedVideo(response.videos[0]);
          fetchVideoStream(response.videos[0]);
        }
      } else {
        console.warn("Invalid response format for videos:", response);
        setAllVideos([]);
      }
    } catch (error) {
      console.error("Failed to fetch videos:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchVideoStream, selectedVideo]);

  const handleVideoRemoving = async (videoID: number) => {
    if (!window.confirm("Are you sure you want to delete this video? This action cannot be undone.")) {
      return;
    }
    setIsLoading(true);

    try {
      const response = await DELETE(`api/delete-video/${videoID}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to delete video: ${response.status}`);
      }

      // Refresh the video list after deletion
      await handleVideosFetching();
    } catch (error) {
      console.error("Failed to delete video:", error);
    } finally {
      handleVideosFetching();
      setIsLoading(false);
    }
  };

  const handleVolumeChange = (e: any) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };
  
  const toggleMute = () => {
    const isNowMuted = !isMuted;
    setIsMuted(isNowMuted);
    if (videoRef.current) {
    videoRef.current.muted = isNowMuted;
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);
  
  useEffect(() => {
    handleVideosFetching();
  }, []);

  // Apply video quality changes
  useEffect(() => {
    if (selectedVideo) {
      fetchVideoStream(selectedVideo);
    }
  }, [videoQuality, fetchVideoStream, selectedVideo]);

  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
  
      if (controlTimeoutRef.current) clearTimeout(controlTimeoutRef.current);
  
      controlTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000); // hide after 3 seconds of inactivity
    };
  
    const videoContainer = videoRef.current?.parentElement;
  
    videoContainer?.addEventListener("mousemove", handleMouseMove);
  
    return () => {
      videoContainer?.removeEventListener("mousemove", handleMouseMove);
      if (controlTimeoutRef.current) clearTimeout(controlTimeoutRef.current);
    };
  }, []);

  // Toggle play state
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // Enter fullscreen
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen()
          .then(() => setIsFullscreen(true))
          .catch(err => console.error('Failed to enter fullscreen:', err));
      }
    } else {
      // Exit fullscreen
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(err => console.error('Failed to exit fullscreen:', err));
    }
  };

  // Update current time as video plays
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Get video duration when metadata is loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // Handle seeking when clicking on progress bar
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressBarRef.current && videoRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pos * duration;
    }
  };

  // Format time from seconds to MM:SS
  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVideoSelect = (video: VideoItem) => {
    setSelectedVideo(video);
    fetchVideoStream(video);

    // Scroll to top when selecting a new video
    window.scrollTo(0, 0);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ar-IQ', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return "Invalid date";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      // Strip milliseconds, ensure T, and remove any timezone offset if not UTC
      let isoString = dateString.trim().replace(' ', 'T');

      // If it doesn't already end in Z or timezone, add Z to make it UTC
      if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(isoString)) {
        isoString += 'Z';
      }

      const date = new Date(isoString);
      const now = new Date();

      const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (isNaN(diffSeconds)) return "Invalid date";
      if (diffSeconds < 0) return "Just now";

      if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
      if (diffSeconds < 3600) return `  قبل ${Math.floor(diffSeconds / 60)} دقيقة `;
      if (diffSeconds < 86400) return ` قبل ${Math.floor(diffSeconds / 3600)} ساعة `;
      if (diffSeconds < 2592000) return ` قبل ${Math.floor(diffSeconds / 86400)} يوم`;
      if (diffSeconds < 31536000) return ` قبل ${Math.floor(diffSeconds / 2592000)} شهر`;
      return `${Math.floor(diffSeconds / 31536000)} سنة `;
    } catch (e) {
      return "Unknown time";
    }
  };

  return (
    <div className="max-w-full mx-auto bg-white shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-white px-6 py-3 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center">
          <Video className="text-blue-600 mr-2" size={24} />
        </div>
        <div>
          <button
            onClick={() => setActiveTab(activeTab === "upload" ? "library" : "upload")}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {activeTab === "library" ? (
              <>
                <Upload size={16} className="ml-2" />
                تحميل
              </>
            ) : (
              <>
                <Video size={16} className="ml-2" />
                المكتبة
              </>
            )}
          </button>
        </div>
      </div>
  
      {/* Main content area */}
      <div className="">
        {/* Sidebar */}
        <div className="w-120 p-4 border-r border-gray-200 sticky top-16">
          <nav className=" w-120 flex justify-center flex-row">
            <button
              onClick={() => setActiveTab("library")}
              className="flex items-center w-60 px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100">
              <Video size={20} className="ml-3" />
              الرئيسية
            </button>
            <button
              onClick={() => setActiveTab("upload")}
              className="flex items-center w-60 px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100">
              <Upload size={20} className="ml-3" />
              تحميل فيديو
            </button>
            <button
              onClick={() => setActiveTab("playlist")}
              className="flex items-center w-60 px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100">
              <Upload size={20} className="ml-3" />
              قوائم التشغيل
            </button>
  
            {/* {lectures.length > 0 && (
              <div className="mt-8">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  المحاضرات
                </h3>
                <div className="space-y-1">
                  {lectures.map(lecture => (
                    <button
                      key={lecture.id}
                      className="flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100"
                    >
                      <span className="truncate">{lecture.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )} */}
          </nav>
        </div>
  
        {/* Main content */}
        <div className="p-0 pb-20 ">
          {activeTab === "upload" ? (
            <UPLOAD />
          ) : activeTab === "playlist" ? (<PLAYLIST />)
          :  (
            <div className="p-6">
              {isLoading && !selectedVideo ? (
                <div className="flex items-center justify-center h-64" role="status">
                  <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="sr-only">جاري التحميل...</span>
                </div>
              ) : allVideos.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <Video className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد فيديوهات حتى الآن</h3>
                  <p className="mt-1 text-sm text-gray-500">ابدأ بتحميل أول فيديو لك.</p>
                  <div className="mt-6">
                    <button
                      onClick={() => setActiveTab("upload")}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Upload size={16} className="ml-2" />
                      تحميل فيديو
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Video Player */}
                  {selectedVideo && (
                    <div ref={containerRef} className="relative mb-8 bg-black rounded-lg overflow-hidden">
                      {isLoading ? (
                        <div className="flex items-center justify-center h-[400px]" role="status">
                          <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="sr-only">جار تحميل الفيديو...</span>
                        </div>
                      ) : (
                        <div className="relative w-full">
                        <video
                          ref={videoRef}
                          src={streamedVideo}
                          className="w-full h-auto"
                          playsInline
                          onClick={togglePlay}
                          onTimeUpdate={handleTimeUpdate}
                          onLoadedMetadata={handleLoadedMetadata}
                          autoPlay
                        />
                      
                        {/* Top Controls */}
                        {showControls && (
                          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 z-10 transition-opacity duration-300">
                            <div className="flex justify-between items-center">
                              <h3 className="text-white font-medium truncate">
                                {selectedVideo.title}
                              </h3>
                              <select
                                value={videoQuality}
                                onChange={(e) => setVideoQuality(e.target.value as "high" | "low")}
                                className="text-xs bg-transparent text-white border border-gray-500 rounded px-2 py-1"
                              >
                                <option value="high" className="text-black">جودة عالية</option>
                                <option value="low" className="text-black">جودة منخفضة</option>
                              </select>
                            </div>
                          </div>
                        )}
                      
                        {/* Bottom Controls */}
                        {showControls && (
                          <div className="absolute bottom-0 left-0 right-0 p-4 z-20 flex items-center bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300">
                            <button onClick={togglePlay} className="text-white mr-3">
                              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                            </button>
                      
                            <span className="text-xs text-white mr-2">{formatTime(currentTime)}</span>
                      
                            <div
                              ref={progressBarRef}
                              className="relative flex-1 h-1.5 bg-gray-600 rounded-full mx-2 cursor-pointer"
                              onClick={handleSeek}
                            >
                              <div
                                className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                                style={{ width: `${(currentTime / duration) * 100}%` }}
                              />
                            </div>
                      
                            <span className="text-xs text-white ml-2">{formatTime(duration)}</span>
                      
                            <button onClick={toggleFullscreen} className="text-white ml-3">
                              {isFullscreen === true ? <ScreenShareOff size={18} /> : <Fullscreen size={18} />}
                            </button>

                            <div className="flex items-center mx-3 group">
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={volume}
                                onChange={handleVolumeChange}
                                className="w-20 h-1 cursor-pointer accent-blue-500 group-hover:block hidden"
                                style={{ transform: "rotate(180deg)" }}
                              />
                              <button onClick={toggleMute} className="text-white mr-2">
                                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                              </button>
                           
                            </div>
                          </div>
                        )}
                      </div>
                      
                      
                      )}
                    </div>
                  )}
  
                  {/* Video Details */}
                  {selectedVideo && (
                    <div className="mb-8">
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">{selectedVideo.title}</h2>
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <span>{formatTimeAgo(selectedVideo.create_at)}</span>
                        <span className="mx-2">•</span>
                        <span>تم التحميل في {formatDate(selectedVideo.create_at)}</span>
                      </div>
                      {selectedVideo.description && (
                        <p className="text-gray-700 whitespace-pre-line">
                          {selectedVideo.description}
                        </p>
                      )}
                    </div>
                  )}
  
                  {/* Video Library */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">الفيديوهات الخاصة بك</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {allVideos.map((video) => (
                        <div
                          key={video.id}
                          onClick={() => handleVideoSelect(video)}
                          className={`border rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${selectedVideo?.id === video.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:shadow-md'
                            }`}
                        >
                          <div className="relative pb-[56.25%] bg-gray-100">
                            {video.thumbnail ? (
                              <> 
                                <button 
                                  className="cursor-pointer z-10 absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold p-1 rounded-lg" 
                                  onClick={(e) => {
                                    e.stopPropagation(); // منع تشغيل onClick الخاص بالأب
                                    handleVideoRemoving(video.id);
                                  }}
                                >
                                  <X />
                                </button>
                                <img
                                  src={getFullPath(video.thumbnail)}
                                  alt={video.title}
                                  className="absolute top-0 left-0 w-full h-full object-cover"
                                />
                              </>
                            ) : (
                              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                                <Video className="h-10 w-10 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <h4 className="font-medium text-gray-900 truncate mb-1">{video.title}</h4>
                            <p className="text-xs text-gray-500">{formatTimeAgo(video.create_at)}</p>
                           
                          </div>
                         
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};