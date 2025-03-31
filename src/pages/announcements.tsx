import React, { useState, useCallback, useEffect } from "react";
import { Megaphone, Plus, AlertCircle, CheckCircle, Trash2, X } from "lucide-react";
import { DELETE, POST } from "../components/Requests";

interface Announcement {
  id: number;
  title: string;
  content: string;
  author_id: number;
  date: string;
}

interface NewAnnouncementState {
  title: string;
  content: string;
}

export const ANNOUNCEMENTS: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState<NewAnnouncementState>({
    title: "",
    content: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormExpanded, setIsFormExpanded] = useState<boolean>(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<number | null>(null);

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
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch announcements";
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
      await handleAnnouncementsFetching();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create announcement";
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
      await handleAnnouncementsFetching();
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : "Failed to delete announcement. Please try again.";
      console.error("Failed to delete announcement:", error);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [announcementToDelete, handleAnnouncementsFetching]);

  useEffect(() => {
    handleAnnouncementsFetching();
  }, [handleAnnouncementsFetching]);

  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <Megaphone className="mr-3 text-blue-600" size={32} />
          Announcements
        </h1>
        <button
          onClick={() => setIsFormExpanded(!isFormExpanded)}
          className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          {isFormExpanded ? (
            <>
              <X className="m-2" size={20} />
            </>
          ) : (
            <>
              <Plus className="m-2" size={20} />
            </>
          )}
        </button>
      </div>

      {/* Announcement Creation Form */}
      {isFormExpanded && (
        <div className="mb-6 p-6 bg-white shadow-md rounded-lg border border-gray-200">
          {error && (
            <div
              className="flex items-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
              role="alert"
            >
              <AlertCircle className="mr-2" size={20} />
              {error}
            </div>
          )}
          <input
            type="text"
            placeholder="Announcement Title"
            value={newAnnouncement.title}
            onChange={(e) =>
              setNewAnnouncement((prev) => ({ ...prev, title: e.target.value }))
            }
            className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <textarea
            placeholder="Announcement Content"
            value={newAnnouncement.content}
            onChange={(e) =>
              setNewAnnouncement((prev) => ({ ...prev, content: e.target.value }))
            }
            className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            disabled={isLoading}
          />
          <button
            onClick={handleAnnouncementInsertion}
            disabled={isLoading}
            className="w-full p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-green-300 flex items-center justify-center"
          >
            {isLoading ? (
              "Creating..."
            ) : (
              <>
                <CheckCircle className="mr-2" size={20} />
                Create Announcement
              </>
            )}
          </button>
        </div>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center text-gray-500">
            <Megaphone className="mr-2 animate-pulse" size={24} />
            Loading announcements...
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center text-gray-500 flex flex-col items-center">
            <Megaphone className="mb-4 text-gray-400" size={48} />
            <p>No announcements found.</p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-semibold mb-3 text-gray-800 flex items-center">
                  <Megaphone className="mr-3 text-blue-500" size={24} />
                  {announcement.title}
                </h2>
                <button
                  onClick={() => setAnnouncementToDelete(announcement.id)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
              <p className="text-gray-700 mb-4">{announcement.content}</p>
              <p className="text-sm text-gray-500">
                Created on {new Date(announcement.date).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {announcementToDelete !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex items-center mb-4">
              <AlertCircle className="mr-3 text-red-500" size={24} />
              <h3 className="text-lg font-bold text-gray-800">Confirm Deletion</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this announcement? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setAnnouncementToDelete(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAnnouncementDeletion}
                disabled={isLoading}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};