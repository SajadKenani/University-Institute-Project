import React, { useState, useCallback, useEffect } from "react";
import { Megaphone, Plus, AlertCircle, CheckCircle, Trash2, X, Calendar, User, Search } from "lucide-react";
import { DELETE, POST } from "../components/Requests";

interface Announcement {
  id: number;
  title: string;
  content: string;
  author_id: number;
  date: string;
  author_name: string;
}

interface NewAnnouncementState {
  title: string;
  content: string;
}

export const ANNOUNCEMENTS: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState<NewAnnouncementState>({
    title: "",
    content: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isFormExpanded, setIsFormExpanded] = useState<boolean>(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");


  const handleAnnouncementsFetching = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userId = Number(localStorage.getItem("userId"));

      if (!userId) {
        throw new Error("User ID not found. Please log in again.");
      }

      const response = await POST("api/fetch-announcements", { author_id: userId });

      if (response && response.data) {
        const sortedAnnouncements = response.data.sort((a: Announcement, b: Announcement) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setAnnouncements(sortedAnnouncements);
        setFilteredAnnouncements(sortedAnnouncements);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "فشل في جلب الإعلانات";
      console.error("Failed to fetch announcements:", error);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAnnouncementInsertion = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userId = Number(localStorage.getItem("userId"));

      if (!userId) {
        throw new Error("User ID not found. Please log in again.");
      }

      const { title, content } = newAnnouncement;
      if (!title.trim() || !content.trim()) {
        throw new Error("Title and content cannot be empty.");
      }

      await POST("api/create-announcement", {
        title,
        content,
        author_id: userId,
      });

      setNewAnnouncement({ title: "", content: "" });
      setIsFormExpanded(false);
      setSuccess("تم إنشاء الإعلان بنجاح!");
      await handleAnnouncementsFetching();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "فشل في إنشاء الإعلان";
      console.error("Failed to create announcement:", error);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [newAnnouncement, handleAnnouncementsFetching]);

  const handleAnnouncementDeletion = useCallback(async () => {
    if (announcementToDelete === null) return;

    try {
      setIsLoading(true);
      await DELETE(`api/delete-announcement/${announcementToDelete}`, {});
      setAnnouncementToDelete(null);
      setSuccess("تم حذف الإعلان بنجاح!");

      // Update the announcements list without refreshing the page
      setAnnouncements((prev) =>
        prev.filter((announcement) => announcement.id !== announcementToDelete)
      );
      setFilteredAnnouncements((prev) =>
        prev.filter((announcement) => announcement.id !== announcementToDelete)
      );

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : "فشل في حذف الإعلان. يرجى المحاولة مرة أخرى.";
      console.error("Failed to delete announcement:", error);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [announcementToDelete]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredAnnouncements(announcements);
      return;
    }
    
    const filtered = announcements.filter(
      announcement =>
        announcement.title.toLowerCase().includes(query.toLowerCase()) ||
        announcement.content.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredAnnouncements(filtered);
  }, [announcements]);

  useEffect(() => {
    handleAnnouncementsFetching();
  }, [handleAnnouncementsFetching]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className=" mx-auto p-6 bg-white min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <Megaphone className="mr-3 text-blue-600" size={32} />
            الإعلانات
          </h1>
          <button
            onClick={() => setIsFormExpanded(!isFormExpanded)}
            className={`flex items-center ${isFormExpanded ? 'bg-gray-500' : 'bg-blue-500'} text-white px-4 py-2 rounded-lg hover:${isFormExpanded ? 'bg-gray-600' : 'bg-blue-600'} transition-colors shadow-md`}
          >
            {isFormExpanded ? (
              <>
                <X className="mr-2" size={20} />
                إلغاء
              </>
            ) : (
              <>
                <Plus className="mr-2" size={20} />
                إعلان جديد
              </>
            )}
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div
            className="flex items-center bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 transition-opacity animate-pulse"
            role="alert"
          >
            <CheckCircle className="mr-2" size={20} />
            {success}
          </div>
        )}

        {/* Search Bar */}
        {!isFormExpanded && 
           <div className="relative mb-6">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
             <Search className="h-5 w-5 text-gray-400" />
           </div>
           <input
             type="text"
             placeholder="البحث في الإعلانات..."
             value={searchQuery}
             onChange={(e) => handleSearch(e.target.value)}
             className="w-full pl-10 p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
           />
         </div>
         }
     
      </div>

      {/* Announcement Creation Form */}
      {isFormExpanded && (
        <div className="mb-8 p-6 bg-white shadow-lg rounded-lg border border-gray-200 transition-all duration-300 ease-in-out ">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center justify-end">
            إنشاء إعلان جديد
            <Plus className="ml-2 text-blue-500" size={24} />
          </h2>
          
          {error && (
            <div
              className="flex items-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
              role="alert"
            >
              <AlertCircle className="mr-2" size={20} />
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1 text-right">العنوان</label>
              <input
                id="title"
                type="text"
                placeholder="أدخل عنوان الإعلان"
                value={newAnnouncement.title}
                onChange={(e) =>
                  setNewAnnouncement((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1 text-right">المحتوى</label>
              <textarea
                id="content"
                placeholder="...أدخل تفاصيل الإعلان"
                value={newAnnouncement.content}
                onChange={(e) =>
                  setNewAnnouncement((prev) => ({ ...prev, content: e.target.value }))
                }
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                rows={6}
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleAnnouncementInsertion}
              disabled={isLoading || !newAnnouncement.title.trim() || !newAnnouncement.content.trim()}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center shadow-md transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  جاري الإنشاء...
                </span>
              ) : (
                <>
                  <CheckCircle className="mr-2" size={20} />
                  نشر الإعلان
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Announcements List */}
      {!isFormExpanded && 
       <div className="space-y-6">
       {isLoading && announcements.length === 0 ? (
         <div className="bg-white p-8 rounded-lg shadow flex flex-col justify-center items-center text-gray-500">
           <div className="animate-pulse flex flex-col items-center">
             <Megaphone className="mb-4" size={48} />
             <div className="h-4 bg-gray-200 rounded w-1/2 mb-2.5"></div>
             <div className="h-3 bg-gray-200 rounded w-1/3"></div>
           </div>
         </div>
       ) : filteredAnnouncements.length === 0 ? (
         <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500 flex flex-col items-center">
           <Megaphone className="mb-4 text-gray-400" size={48} />
           {searchQuery ? (
             <>
               <p className="text-lg font-medium">لم يتم العثور على إعلانات مطابقة</p>
               <p className="text-sm mt-2">حاول تعديل مصطلحات البحث</p>
             </>
           ) : (
             <>
               <p className="text-lg font-medium">لا توجد إعلانات حتى الآن</p>
               <p className="text-sm mt-2">أنشئ أول إعلان للبدء</p>
               <button
                 onClick={() => setIsFormExpanded(true)}
                 className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
               >
                 <Plus className="mr-2" size={16} />
                 إنشاء إعلان
               </button>
             </>
           )}
         </div>
       ) : (
         filteredAnnouncements.map((announcement) => (
           <div
             key={announcement.id}
             className="bg-white border border-gray-200 rounded-lg p-6 shadow hover:shadow-md transition-shadow"
           >
             <div className="flex justify-between items-start">
               <h2 className="text-xl font-semibold mb-3 text-gray-800">
                 {announcement.title}
               </h2>
               <button
                 onClick={() => setAnnouncementToDelete(announcement.id)}
                 className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                 aria-label="حذف الإعلان"
               >
                 <Trash2 size={18} />
               </button>
             </div>
             
             <div className="prose max-w-none text-gray-700 mb-4 whitespace-pre-wrap">
               {announcement.content}
             </div>
             
             <div className="flex items-center text-sm text-gray-500 pt-4 border-t border-gray-100">
               <div className="flex items-center mr-4">
                 <Calendar className="h-4 w-4 mr-1" />
                 {formatDate(announcement.date)}
               </div>
               <div className="flex items-center">
                 <User className="h-4 w-4 mr-1" />
                  {announcement.author_name}
               </div>
             </div>
           </div>
         ))
       )}
     </div>
     }
     

      {/* Delete Confirmation Modal */}
      {announcementToDelete !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md animate-fadeIn">
            <div className="flex items-center mb-4 text-red-500">
              <AlertCircle className="mr-3" size={24} />
              <h3 className="text-lg font-bold">تأكيد الحذف</h3>
            </div>
            <p className="text-gray-600 mb-6">
              هل أنت متأكد أنك تريد حذف هذا الإعلان؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setAnnouncementToDelete(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleAnnouncementDeletion}
                disabled={isLoading}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري الحذف...
                  </span>
                ) : (
                  <>
                    <Trash2 className="mr-2" size={16} />
                    حذف
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button for Mobile */}
      <div className="md:hidden fixed bottom-6 right-6">
        <button
          onClick={() => setIsFormExpanded(!isFormExpanded)}
          className={`p-4 ${isFormExpanded ? 'bg-gray-500' : 'bg-blue-500'} text-white rounded-full shadow-lg hover:${isFormExpanded ? 'bg-gray-600' : 'bg-blue-600'} transition-colors`}
        >
          {isFormExpanded ? <X size={24} /> : <Plus size={24} />}
        </button>
      </div>
    </div>
  );
};