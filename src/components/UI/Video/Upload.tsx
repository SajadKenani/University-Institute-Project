import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Image, Upload, Video, X } from "lucide-react";
import { GET, getToken } from "../../Requests";
import { HandleLogin } from "../../Auth";

const API_BASE_URL = import.meta.env.VITE_SERVER_URL;

interface Lecture {
    id: number;
    name: string;
}

export const UPLOAD = () => {
    // File handling states
    const [file, setFile] = useState<File | null>(null);
    const [thumbnail, setThumbnail] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [uploading, setUploading] = useState(false);
    // Form states
    const [videoTitle, setVideoTitle] = useState<string>("");
    const [videoDesc, setVideoDesc] = useState<string>("");
    const [selectedLecture, setSelectedLecture] = useState<number | null>(null);

    const [lectures, setLectures] = useState<Lecture[]>([]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const selectedFile = event.target.files[0];

            // Validate file type
            const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
            if (!validVideoTypes.includes(selectedFile.type)) {
                setError("Please select a valid video format (MP4, WebM, MOV)");
                return;
            }

            setFile(selectedFile);

            // Set default title from filename (without extension)
            const fileName = selectedFile.name.split('.').slice(0, -1).join('.');
            setVideoTitle(fileName);

            setError(null);
            setSuccess(false);
        }
    };

    const handleThumbnailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const selectedThumbnail = event.target.files[0];

            // Validate thumbnail format
            const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
            if (!validImageTypes.includes(selectedThumbnail.type)) {
                setError("Please select a valid image format (JPEG, PNG, WEBP)");
                return;
            }

            setThumbnail(selectedThumbnail);

            // Create preview URL for the thumbnail
            const thumbnailURL = URL.createObjectURL(selectedThumbnail);
            setThumbnailPreview(thumbnailURL);

            setError(null);
        }
    };

    const resetForm = () => {
        setFile(null);
        setVideoTitle("");
        setVideoDesc("");
        setThumbnail(null);
        setThumbnailPreview(null);
        setSelectedLecture(null);

        // Reset file inputs
        const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
        fileInputs.forEach(input => {
            input.value = "";
        });
    };

    const handleUpload = useCallback(async () => {
        if (!file) {
            setError("Please select a video file first");
            return;
        }

        if (!videoTitle.trim()) {
            setError("Please provide a title for your video");
            return;
        }

        if (selectedLecture === null) {
            setError("Please select a lecture");
            return;
        }

        setUploading(true);
        setError(null);
        setSuccess(false);

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
                Authorization: `Bearer ${authToken}`,
            };

            const formData = new FormData();
            formData.append("video", file);
            formData.append("title", videoTitle);
            formData.append("desc", videoDesc);
            formData.append("lecture_id", String(selectedLecture));

            // Get author ID from localStorage
            const userId = localStorage.getItem("userId");
            if (!userId) {
                throw new Error("User ID not found. Please log in again.");
            }

            formData.append("author_id", userId);

            // Add thumbnail if available
            if (thumbnail) {
                formData.append("thumbnail", thumbnail);
            }

            const response = await fetch(`${API_BASE_URL}/api/upload-video`, {
                method: "POST",
                body: formData,
                headers: headers,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `Server responded with status: ${response.status}`);
            }

            await response.json();

            setSuccess(true);
            resetForm();


        } catch (error) {
            console.error("Upload failed:", error);
            setError(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
            setUploading(false);
        }
    }, [file, thumbnail, videoTitle, videoDesc, selectedLecture]);

    const handleLecturesFetching = useCallback(async () => {
        try {
            const response = await GET("api/fetch-all-lectures");
            if (response?.data && Array.isArray(response.data)) {
                setLectures(response.data);
            } else {
                console.warn("Invalid response format for lectures:", response);
                setLectures([]);
            }
        } catch (error) {
            console.error("Failed to fetch lectures:", error);
            setError(`Failed to load lectures: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }, []);

    useEffect(() => {
        handleLecturesFetching();

        // Cleanup function to revoke object URLs when component unmounts
        return () => {
            if (thumbnailPreview) {
                URL.revokeObjectURL(thumbnailPreview);
            }
        };
    }, [handleLecturesFetching]);

    // Error message display component
    const ErrorMessage = ({ message }: { message: string }) => (
        <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start" role="alert">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-2" />
            <div className="text-sm text-red-700">{message}</div>
        </div>
    );

    // Success message display component
    const SuccessMessage = ({ message }: { message: string }) => (
        <div className="mx-6 mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-start" role="alert">
            <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 mr-2" />
            <div className="text-sm text-green-700">{message}</div>
        </div>
    );
    return (
        <div className="mx-10">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex flex-col md:flex-row ">
                    {/* File drop area */}
                    <div className="md:w-1/2 p-6 border-r border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-gray-800">تحميل فيديو جديد</h3>
                        </div>
                        <div
                            className={`border-2 border-dashed rounded-lg ${file ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                                } transition-colors duration-200 ease-in-out py-8 px-4 text-center`}
                        >
                            <input
                                type="file"
                                id="video-file"
                                accept="video/mp4,video/webm,video/quicktime"
                                onChange={handleFileChange}
                                className="hidden"
                                aria-label="تحميل ملف فيديو"
                            />

                            {file ? (
                                <div>
                                    <div className="flex items-center justify-center mb-4">
                                        <Video className="h-12 w-12 text-blue-500" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {(file.size / (1024 * 1024)).toFixed(2)} ميجابايت · {file.type.split('/')[1].toUpperCase()}
                                    </p>
                                    <button
                                        onClick={() => {
                                            setFile(null);
                                            setVideoTitle("");

                                            // Reset the file input
                                            const fileInput = document.getElementById('video-file') as HTMLInputElement;
                                            if (fileInput) fileInput.value = "";
                                        }}
                                        className="mt-4 inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        aria-label="إزالة الملف"
                                    >
                                        <X size={14} className="mr-1" />
                                        إزالة
                                    </button>
                                </div>
                            ) : (
                                <label htmlFor="video-file" className="cursor-pointer">
                                    <div className="flex items-center justify-center mb-4">
                                        <Upload className="h-12 w-12 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-900">
                                        اسحب وأفلت أو انقر للتحميل
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        MP4, WebM أو MOV
                                    </p>
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Form fields */}
                    <div className="md:w-1/2 p-6 space-y-4">
                        <div>
                            <label htmlFor="video-title" className="block text-sm font-medium text-gray-700">
                                عنوان الفيديو <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="video-title"
                                value={videoTitle}
                                onChange={(e) => setVideoTitle(e.target.value)}
                                placeholder="أدخل عنوانًا وصفيًا"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                disabled={uploading}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="video-desc" className="block text-sm font-medium text-gray-700">
                                الوصف
                            </label>
                            <textarea
                                id="video-desc"
                                value={videoDesc}
                                onChange={(e) => setVideoDesc(e.target.value)}
                                placeholder="قدم تفاصيل حول الفيديو الخاص بك"
                                rows={4}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                disabled={uploading}
                            />
                        </div>

                        <div>
                            <label htmlFor="lecture-select" className="block text-sm font-medium text-gray-700">
                                اختر المحاضرة <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="lecture-select"
                                value={selectedLecture || ""}
                                onChange={(e) => setSelectedLecture(e.target.value ? Number(e.target.value) : null)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                disabled={uploading}
                                required
                            >
                                <option value="">اختر محاضرة</option>
                                {lectures.map((lecture) => (
                                    <option key={lecture.id} value={lecture.id}>
                                        {lecture.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                الصورة المصغرة
                            </label>
                            <div className="mt-1 flex items-center">
                                <div className="flex-shrink-0 h-16 w-24 bg-gray-100 rounded-md overflow-hidden">
                                    {thumbnailPreview ? (
                                        <img
                                            src={thumbnailPreview}
                                            alt="معاينة الصورة المصغرة"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center">
                                            <Image className="h-8 w-8 text-gray-300" />
                                        </div>
                                    )}
                                </div>

                                <div className="mr-4 flex-1">
                                    <input
                                        type="file"
                                        id="thumbnail-file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleThumbnailChange}
                                        className="hidden"
                                        disabled={uploading}
                                        aria-label="تحميل صورة مصغرة"
                                    />
                                    <label
                                        htmlFor="thumbnail-file"
                                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none cursor-pointer"
                                    >
                                        <Upload size={16} className="ml-2" />
                                        {thumbnailPreview ? "تغيير الصورة المصغرة" : "تحميل صورة مصغرة"}
                                    </label>
                                    <p className="mt-1 text-xs text-gray-500">
                                        JPEG, PNG أو WebP (الحد الأقصى 5 ميجابايت)
                                    </p>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions section */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                        <span className="font-medium">ملاحظة:</span> سيتم معالجة الملفات وتحسينها بعد التحميل
                    </div>
                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading || !videoTitle.trim() || !selectedLecture}
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${!file || uploading || !videoTitle.trim() || !selectedLecture
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            }`}
                        aria-busy={uploading}
                    >
                        {uploading ? (
                            <>
                                <svg className="animate-spin ml-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                جاري التحميل...
                            </>
                        ) : (
                            <>
                                <Upload size={16} className="ml-2" />
                                تحميل الفيديو
                            </>
                        )}
                    </button>
                </div>

                {/* Success/Error notifications */}
                {error && <ErrorMessage message={error} />}
                {success && <SuccessMessage message="تم تحميل الفيديو بنجاح! سيكون متاحًا في مكتبتك قريبًا." />}
            </div>
        </div>
    )
}