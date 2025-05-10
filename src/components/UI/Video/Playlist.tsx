import { useCallback, useEffect, useState } from "react";
import { DELETE, GET, getToken, POST } from "../../Requests";
import { HandleLogin } from "../../Auth";
import { X, Plus, Music, Video, Search, AlertCircle, Check } from "lucide-react";

/**
 * Interface definitions
 */
interface Playlist {
  id: number;
  title: string;
  thumbnail?: string;
  track_count?: number;
  created_at?: string;
}

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

const API_BASE_URL = import.meta.env.VITE_SERVER_URL;

/**
 * Main Playlist Component
 */
export const PLAYLIST = () => {
  // State management
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistTitle, setPlaylistTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVideoToPlaylistModal, setShowVideoToPlaylistModal] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<number | null>(null);
  const [allVideos, setAllVideos] = useState<VideoItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [addedVideos, setAddedVideos] = useState<number[]>([]);
  
  /**
   * Fetch playlists from API
   */
  const handlePlaylistsFetching = useCallback(async () => {
    setIsFetching(true);
    setError(null);
    const authorID = localStorage.getItem("userId");
    if (!authorID) {
      setError("يرجى تسجيل الدخول أولاً");
      setIsFetching(false);
      return;
    }

    try {
      const response = await GET(`api/fetch-playlists/${authorID}`);
      if (!response || !response.data) throw new Error("استجابة غير صالحة من الخادم");
      setPlaylists(response.data);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      setError("فشلت عملية تحميل قوائم التشغيل");
    } finally {
      setIsFetching(false);
    }
  }, []);

  /**
   * Create a new playlist
   */
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!playlistTitle.trim()) {
      setError("يرجى إدخال عنوان قائمة التشغيل");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    const authorID = localStorage.getItem("userId");
    if (!authorID) {
      setError("يرجى تسجيل الدخول أولاً");
      setIsLoading(false);
      return;
    }
    
    const formData = new FormData();
    
    // Append all required data to formData
    formData.append("title", playlistTitle);
    formData.append("author_id", authorID);
    if (thumbnail) formData.append("thumbnail", thumbnail);
    
    try {
      let authToken = await getToken();
      
      if (!authToken) {
        await HandleLogin();
        authToken = await getToken();

        if (!authToken) {
          throw new Error("فشلت عملية المصادقة. يرجى تسجيل الدخول مرة أخرى.");
        }
      }

      const headers: Record<string, string> = {
        Authorization: `Bearer ${authToken}`,
      };

      const response = await fetch(`${API_BASE_URL}/api/create-playlist`, {
        method: "POST",
        body: formData,
        headers: headers,
      }); 

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `استجاب الخادم بالحالة: ${response.status}`);
      }

      await response.json();
      
      setSuccess("تم إنشاء قائمة التشغيل بنجاح");
      resetForm();
      
      // Refresh playlist list
      handlePlaylistsFetching();
    } catch (error: any) {
      console.error("Error creating playlist:", error);
      setError(error.message || "فشلت عملية إنشاء قائمة التشغيل");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reset form fields
   */
  const resetForm = () => {
    setPlaylistTitle("");
    setThumbnail(null);
    setThumbnailPreview(null);
    setShowCreateModal(false);
  };

  /**
   * Handle thumbnail file selection
   */
  const handleThumbnailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      processThumbnailFile(event.target.files[0]);
    }
  };

  /**
   * Handle drag events for thumbnail upload
   */
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  /**
   * Handle drop events for thumbnail upload
   */
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processThumbnailFile(e.dataTransfer.files[0]);
    }
  };

  /**
   * Process and validate thumbnail file
   */
  const processThumbnailFile = (file: File) => {
    // Validate thumbnail format
    const validImageTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!validImageTypes.includes(file.type)) {
      setError("يرجى اختيار صورة بصيغة مناسبة (JPEG, PNG, WEBP)");
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      setError("حجم الصورة يجب أن لا يتجاوز 2 ميغابايت");
      return;
    }

    setThumbnail(file);

    // Create preview URL for the thumbnail
    const thumbnailURL = URL.createObjectURL(file);
    setThumbnailPreview(thumbnailURL);
    setError(null);
  };

  /**
   * Format date to Arabic locale
   */
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('ar-IQ', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }).format(date);
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString;
    }
  };

  /**
   * Delete a playlist
   */
  const handlePlaylistRemoving = useCallback(async (id: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent playlist selection when clicking delete
    }
    
    if (!confirm("هل أنت متأكد من حذف قائمة التشغيل هذه؟")) {
      return;
    }
    
    setIsLoading(true);
    try {
      await DELETE(`api/delete-playlist/${id}`);
      
      // If the deleted playlist was selected, deselect it
      if (selectedPlaylist === id) {
        setSelectedPlaylist(null);
      }
      
      setSuccess("تم حذف قائمة التشغيل بنجاح");
      handlePlaylistsFetching();
    } catch(error) {
      console.error("Error removing playlist:", error);
      setError("فشلت عملية حذف قائمة التشغيل");
    } finally { 
      setIsLoading(false);
    }
  }, [handlePlaylistsFetching, selectedPlaylist]);

  /**
   * Select a playlist
   */
  const handlePlaylistSelection = useCallback((id: number) => {
    setSelectedPlaylist(prevId => prevId === id ? null : id);
  }, []);

  /**
   * Fetch all videos
   */
  const handleVideosFetching = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        throw new Error("لم يتم العثور على هوية المستخدم. يرجى تسجيل الدخول مرة أخرى.");
      }

      const response = await POST("api/fetch-videos", { author_id: Number(userId) });

      if (response?.videos && Array.isArray(response.videos)) {
        setAllVideos(response.videos);
      } else {
        console.warn("Invalid response format for videos:", response);
        setAllVideos([]);
      }
    } catch (error) {
      console.error("Failed to fetch videos:", error);
      setError(`فشل تحميل الفيديوهات: ${error instanceof Error ? error.message : "خطأ غير معروف"}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Add a video to the selected playlist
   */
  const handleAddingToPlaylist = useCallback(async (video_id: number) => {
    if (!selectedPlaylist) {
      setError("يرجى اختيار قائمة تشغيل أولاً");
      return;
    }
    
    try {
      setIsLoading(true);
      await POST("api/add-video-to-playlist", {
        video_id, 
        playlist_id: selectedPlaylist
      });
      
      // Track added videos for UI feedback
      setAddedVideos(prev => [...prev, video_id]);
      
      setSuccess("تمت إضافة الفيديو بنجاح");
    } catch (error) {
      console.error("Error adding video to playlist:", error);
      setError("فشلت عملية إضافة الفيديو");
    } finally {
      setIsLoading(false);
    }
  }, [selectedPlaylist]);

  /**
   * Filter videos based on search term
   */
  const filteredVideos = allVideos.filter(video => 
    video.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /**
   * Get full path for assets
   */
  const getFullPath = (path: string) => {
    if (!path) return "";
    return path.startsWith("http") ? path : `${API_BASE_URL}/${path}`;
  };

  // Initial data loading
  useEffect(() => {
    handlePlaylistsFetching();
    handleVideosFetching();
  }, [handlePlaylistsFetching, handleVideosFetching]);

  // Cleanup thumbnail previews to prevent memory leaks
  useEffect(() => {
    return () => {
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [thumbnailPreview]);

  // Auto-hide success messages after timeout
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Handle escape key for modals
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showCreateModal) setShowCreateModal(false);
        if (showVideoToPlaylistModal) setShowVideoToPlaylistModal(false);
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showCreateModal, showVideoToPlaylistModal]);

  // Control body scroll when modals are open
  useEffect(() => {
    const modalOpen = showCreateModal || showVideoToPlaylistModal;
    document.body.style.overflow = modalOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [showCreateModal, showVideoToPlaylistModal]);

  // Reset added videos when modal closes
  useEffect(() => {
    if (!showVideoToPlaylistModal) {
      setAddedVideos([]);
    }
  }, [showVideoToPlaylistModal]);

  return (
    <div className="mr-6 relative flex flex-col w-full" dir="rtl">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">قوائم التشغيل</h1>
      
      {/* Notification Messages */}
      {error && (
        <div className="p-4 mb-6 bg-red-50 border-r-4 border-red-500 text-red-700 rounded shadow-sm animate-fadeIn">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 ml-2" />
            <p>{error}</p>
          </div>
        </div>
      )}
      
      {success && (
        <div className="p-4 mb-6 bg-green-50 border-r-4 border-green-500 text-green-700 rounded shadow-sm animate-fadeIn">
          <div className="flex items-center">
            <Check className="w-5 h-5 ml-2" />
            <p>{success}</p>
          </div>
        </div>
      )}
      
      {/* Create Playlist Button */}
      <button 
        onClick={() => setShowCreateModal(true)}
        className="fixed flex items-center py-2 px-4 bg-gradient-to-r from-blue-500 to-blue-600 
        text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none 
        focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all bottom-4 left-4 shadow-lg z-10"
        aria-label="إنشاء قائمة تشغيل جديدة"
      >
        <Plus className="ml-2" size={18} />
        <span>إنشاء قائمة تشغيل</span>
      </button>
      
      {/* Playlists Display Section */}
      {isFetching ? (
        <div className="flex items-center justify-center h-40 bg-white rounded-lg shadow-md">
          <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : playlists.length > 0 ? (
        <div className="flex flex-col md:flex-row gap-6 mt-4 w-full">
          {/* Playlists Column */}
          <div className="w-full md:w-2/5">
            <h2 className="text-lg font-semibold mb-3 text-gray-700">قوائم التشغيل المتاحة</h2>
            <div className="space-y-3 pr-2">
              {playlists.map((playlist) => (
                <div 
                  key={playlist.id} 
                  className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${
                    selectedPlaylist === playlist.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => handlePlaylistSelection(playlist.id)}
                >
                  <div className="flex">
                    <div className="flex-shrink-0 w-24 h-24 bg-gray-100">
                      {playlist.thumbnail ? (
                        <img 
                          src={getFullPath(playlist.thumbnail)}
                          alt={playlist.title} 
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          <Music className="w-10 h-10 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">{playlist.title}</h3>
                      <div className="flex items-center text-sm text-gray-500">
                        {playlist.created_at && (
                          <span className="flex items-center">
                            <svg className="w-4 h-4 ml-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDate(playlist.created_at)}
                          </span>
                        )}
                        {playlist.track_count !== undefined && (
                          <span className="mr-3 flex items-center">
                            <Video className="w-4 h-4 ml-1" />
                            {playlist.track_count} فيديو
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handlePlaylistRemoving(playlist.id, e)}
                      className="text-xs text-red-600 hover:text-red-800 p-2 h-12 self-start transition-colors"
                      aria-label="حذف قائمة التشغيل"
                    >
                      <X height={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Videos Section - Only shown when a playlist is selected */}
          {selectedPlaylist && (
            <div className="w-full md:w-3/5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-700">
                  إضافة فيديوهات إلى قائمة التشغيل
                </h2>
                <button 
                  onClick={() => setShowVideoToPlaylistModal(true)} 
                  className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  عرض كل الفيديوهات
                </button>
              </div>
              
              <p className="text-gray-600 mb-4">
                قائمة التشغيل المحددة: <span className="font-semibold">{playlists.find(p => p.id === selectedPlaylist)?.title}</span>
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-md p-6 text-center">
          <Music className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">لا توجد قوائم تشغيل</h3>
          <p className="text-gray-500">قم بإنشاء أول قائمة تشغيل للبدء</p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="mt-4 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="ml-1" size={16} />
            إنشاء قائمة تشغيل
          </button>
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden w-full max-w-lg animate-fadeIn">
            <div className="relative">
              <div className="p-5 bg-gradient-to-r from-blue-500 to-purple-600 flex justify-between items-center">
                <h3 className="font-bold text-lg text-white">إنشاء قائمة تشغيل جديدة</h3>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-white hover:text-gray-200 focus:outline-none"
                  aria-label="إغلاق"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleFormSubmit} className="p-5">
                <div className="mb-4">
                  <label htmlFor="playlist-title" className="block mb-2 font-medium text-gray-700">عنوان قائمة التشغيل</label>
                  <input 
                    id="playlist-title"
                    type="text"
                    value={playlistTitle}
                    onChange={(e) => setPlaylistTitle(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="أدخل عنوان قائمة التشغيل"
                    required
                  />
                </div>
                
                <div className="mb-5">
                  <label className="block mb-2 font-medium text-gray-700">صورة مصغرة</label>
                  <div 
                    className={`relative border-2 border-dashed rounded-lg p-6 text-center ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                  >
                    {thumbnailPreview ? (
                      <div className="flex flex-col items-center">
                        <img 
                          src={thumbnailPreview} 
                          alt="معاينة الصورة المصغرة" 
                          className="h-32 w-32 object-cover rounded-md shadow-sm mb-2"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setThumbnail(null);
                            setThumbnailPreview(null);
                          }}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          إزالة
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="mt-1 text-sm text-gray-500">
                          اسحب وأفلت صورة أو {" "}
                          <label className="text-blue-500 hover:text-blue-700 cursor-pointer">
                            تصفح
                            <input
                              type="file"
                              className="hidden"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={handleThumbnailChange}
                            />
                          </label>
                        </p>
                        <p className="mt-1 text-xs text-gray-400">PNG, JPG, WEBP حتى 2 ميغابايت</p>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button 
                    type="button" 
                    onClick={() => setShowCreateModal(false)}
                    className="py-2 px-4 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit" 
                    className="py-2 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-md hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-70"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin ml-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        جاري الإنشاء...
                      </span>
                    ) : "إنشاء قائمة التشغيل"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Videos To Playlist Modal */}
      {showVideoToPlaylistModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden w-full max-w-4xl max-h-[90vh] animate-fadeIn">
            <div className="relative flex flex-col h-full">
              <div className="p-5 bg-gradient-to-r from-blue-500 to-purple-600 flex justify-between items-center">
                <h3 className="font-bold text-lg text-white">إضافة فيديوهات إلى قائمة التشغيل</h3>
                <button 
                  onClick={() => setShowVideoToPlaylistModal(false)}
                  className="text-white hover:text-gray-200 focus:outline-none"
                  aria-label="إغلاق"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-5 overflow-hidden flex flex-col flex-grow">
                {/* Search Bar */}
                <div className="mb-4 relative">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Search className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                                  type="text"
                                  placeholder="البحث عن فيديو..."
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                  className="block w-full pr-10 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                />
                              </div>
                              
                              {/* Selected Playlist Info */}
                              {selectedPlaylist && (
                                <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-100">
                                  <p className="text-blue-800">
                                    إضافة الفيديوهات إلى قائمة التشغيل: <span className="font-semibold">{playlists.find(p => p.id === selectedPlaylist)?.title}</span>
                                  </p>
                                </div>
                              )}
                              
                              {/* Videos List */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[50vh]">
                                {isLoading ? (
                                  <div className="col-span-full flex justify-center py-8">
                                    <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  </div>
                                ) : filteredVideos.length > 0 ? (
                                  filteredVideos.map((video) => (
                                    <div 
                                      key={video.id} 
                                      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                                    >
                                      <div className="aspect-video relative bg-gray-100">
                                        {video.thumbnail_url ? (
                                          <img 
                                            src={getFullPath(video.thumbnail_url || video.thumbnail || "")}
                                            alt={video.title} 
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                            <Video className="w-12 h-12 text-gray-400" />
                                          </div>
                                        )}
                                      </div>
                                      
                                      <div className="p-3">
                                        <h4 className="font-medium text-gray-900 mb-2 line-clamp-2" title={video.title}>
                                          {video.title}
                                        </h4>
                                        
                                        <div className="flex justify-between items-center mt-3">
                                          <span className="text-xs text-gray-500">
                                            {formatDate(video.create_at)}
                                          </span>
                                          
                                          <button 
                                            type="button"
                                            onClick={() => handleAddingToPlaylist(video.id)}
                                            disabled={addedVideos.includes(video.id) || !selectedPlaylist}
                                            className={`py-1 px-3 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                                              addedVideos.includes(video.id)
                                                ? 'bg-green-100 text-green-700 cursor-default'
                                                : !selectedPlaylist
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors'
                                            }`}
                                          >
                                            {addedVideos.includes(video.id) ? (
                                              <span className="flex items-center">
                                                <Check className="ml-1" size={14} />
                                                تمت الإضافة
                                              </span>
                                            ) : (
                                              'إضافة'
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="col-span-full text-center py-10">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                    </svg>
                                    <h4 className="mt-2 text-gray-900 font-medium">لم يتم العثور على فيديوهات</h4>
                                    <p className="text-gray-500 text-sm mt-1">
                                      {searchTerm 
                                        ? 'لا توجد نتائج تطابق البحث'
                                        : 'لم يتم العثور على أي فيديوهات متاحة'
                                      }
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
              
                            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
                              <button 
                                type="button" 
                                onClick={() => setShowVideoToPlaylistModal(false)}
                                className="py-2 px-4 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                              >
                                إغلاق
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              };