import { useCallback, useEffect, useState } from "react";
import { DELETE, GET, getToken } from "../../Requests";
import { HandleLogin } from "../../Auth";
import { X, Plus, Music } from "lucide-react"

interface Playlist {
  id: number;
  title: string;
  thumbnail?: string;
  track_count?: number;
  created_at?: string;
}

const API_BASE_URL = import.meta.env.VITE_SERVER_URL;

export const PLAYLIST = () => {
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

  const handlePlaylistsFetching = useCallback(async () => {
    setIsFetching(true);
    setError(null);
    const authorID = localStorage.getItem("userId");
    if (!authorID) return 

    try {
      const response = await GET(`api/fetch-playlists/${authorID}`);
      setPlaylists(response.data);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      setError("فشلت عملية تحميل قوائم التشغيل");
    } finally {
      setIsFetching(false);
    }
  }, []);

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
    const formData = new FormData();
    
    // Append all required data to formData
    formData.append("title", playlistTitle);
    
    if (authorID) { formData.append("author_id", authorID); }
    if (thumbnail) { formData.append("thumbnail", thumbnail); }
    
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
      setPlaylistTitle(""); // Reset form
      setThumbnail(null);
      setThumbnailPreview(null);
      setShowCreateModal(false); // Close modal after success
      
      // Refresh playlist list
      handlePlaylistsFetching();
    } catch (error: any) {
      console.error("Error creating playlist:", error);
      setError(error.message || "فشلت عملية إنشاء قائمة التشغيل");
    } finally {
      setIsLoading(false);
    }
  };

  const handleThumbnailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      processThumbnailFile(event.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processThumbnailFile(e.dataTransfer.files[0]);
    }
  };

  const processThumbnailFile = (file: File) => {
    // Validate thumbnail format
    const validImageTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!validImageTypes.includes(file.type)) {
      setError("يرجى اختيار صورة بصيغة مناسبة (JPEG, PNG, WEBP)");
      return;
    }

    setThumbnail(file);

    // Create preview URL for the thumbnail
    const thumbnailURL = URL.createObjectURL(file);
    setThumbnailPreview(thumbnailURL);
    setError(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-IQ', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  const handlePlaylistRemoving = useCallback(async (id: number) => {
    setIsLoading(true);
    setIsFetching(true);
    try {
      await DELETE(`api/delete-playlist/${id}`);
      setSuccess("تم حذف قائمة التشغيل بنجاح");
    } catch(error) {
      console.log(error);
      setError("فشلت عملية حذف قائمة التشغيل");
    } finally { 
      handlePlaylistsFetching();
      setIsLoading(false);
    }
  }, [handlePlaylistsFetching]);

  // Cleanup function for thumbnail preview URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [thumbnailPreview]);

  useEffect(() => {
    handlePlaylistsFetching();
  }, [handlePlaylistsFetching]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [success]);

  const getFullPath = (path: string) => {
    if (!path) return "";
    return path.startsWith("http") ? path : `${API_BASE_URL}/${path}`;
  };

  // Close modal with Escape key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showCreateModal) {
        setShowCreateModal(false);
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [showCreateModal]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showCreateModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showCreateModal]);

  return (
    <div className="max-w-6xl mx-auto p-4 relative" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">قوائم التشغيل</h2>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center py-2 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-md hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
        >
          <Plus className="ml-2" size={18} />
          إنشاء قائمة تشغيل جديدة
        </button>
      </div>
      
      {error && (
        <div className="p-4 mb-6 bg-red-50 border-r-4 border-red-500 text-red-700 rounded shadow-sm animate-fadeIn">
          <div className="flex">
            <p>{error}</p>
            <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      )}
      
      {success && (
        <div className="p-4 mb-6 bg-green-50 border-r-4 border-green-500 text-green-700 rounded shadow-sm animate-fadeIn">
          <div className="flex">
            <p>{success}</p>
            <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}
      
      {/* Playlists Display Section */}
      {isFetching ? (
        <div className="flex items-center justify-center h-40 bg-white rounded-lg shadow-md">
          <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : playlists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map((playlist) => (
            <div 
              key={playlist.id} 
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="flex">
                <div className="flex-shrink-0 w-24 h-24 bg-gray-100">
                  {playlist.thumbnail ? (
                    <img 
                      src={getFullPath(playlist.thumbnail)}
                      alt={playlist.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <Music className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="p-4 flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">{playlist.title}</h3>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    {playlist.created_at && (
                      <span className="flex items-center ml-4">
                        <svg className="w-4 h-4 ml-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(playlist.created_at)}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handlePlaylistRemoving(playlist.id)}
                  className="text-xs text-red-600 hover:text-red-800 p-2"
                  aria-label="حذف قائمة التشغيل"
                >
                  <X height={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-md p-6 text-center">
          <Music className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">لا توجد قوائم تشغيل</h3>
          <p className="text-gray-500">قم بإنشاء أول قائمة تشغيل للبدء</p>
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
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleFormSubmit} className="p-5">
                <div className="mb-4">
                  <label className="block mb-2 font-medium text-gray-700">عنوان قائمة التشغيل</label>
                  <input 
                    type="text"
                    value={playlistTitle}
                    onChange={(e) => setPlaylistTitle(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="أدخل عنوان قائمة التشغيل"
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
    </div>
  );
}