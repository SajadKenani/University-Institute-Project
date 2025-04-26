import { useCallback, useEffect, useState } from "react";
import { DELETE, GET, POST } from "../components/Requests";
import { Calendar, Users, Loader2, CheckCircle, MapPin, Hash, X } from "lucide-react";

interface Lecture {
  id: number;
  name: string;
  description?: string;
  location?: string;
  date?: string;
  time?: string;
  instructor?: string;
  secret_number: string;
  attendees_count?: number;
  author_name?: string;
  is_attendence_valid?: number;
}

interface Student {
  id: number;
  name: string;
  email?: string;
}

interface Attendee {
  id: number;
  date: string;
  student: {
    id: number;
    name: string;
    email?: string;
    timestamp: string;
    lecture_id: number;
  }
}

export const SPECIFIEDLECTURE = () => {
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudentID, setSelectedStudentID] = useState<number | null>(null);
  const [manualSignInSuccess, setManualSignInSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRemoving, setIsRemoving] = useState<number | null>(null);
  const [isChangingStatus, setIsChangingStatus] = useState<boolean>(false);

  // Get lecture ID safely from localStorage
  const getLectureId = useCallback(() => {
    const lectureId = Number(localStorage.getItem("lectureID"));
    if (!lectureId || isNaN(lectureId)) {
      throw new Error("No valid lecture ID found");
    }
    return lectureId;
  }, []);

  // Fetch specific lecture data
  const fetchLecture = useCallback(async () => {
    try {
      const lectureId = getLectureId();
      const response = await GET(`api/fetch-specified-lecture/${lectureId}`);
      setLecture(response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching lecture:", error);
      setError(error instanceof Error ? error.message : "Failed to load lecture information");
      return null;
    } 
  }, [getLectureId]);

  // Fetch attendance data
  const fetchAttendance = useCallback(async () => {
    try {
      const lectureId = getLectureId();
      const response = await GET(`api/fetch-attendence/${lectureId}`);
      setAttendees(response.data || []);
      return response.data;
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setAttendees([]);
      return null;
    }
  }, [getLectureId]);

  // Fetch available students
  const fetchStudents = useCallback(async () => {
    try {
      const authorID = localStorage.getItem("userId");
      if (!authorID) throw new Error("User ID not found");
      
      const response = await GET(`api/fetch-student-accounts/${authorID}`);
      setStudents(response.data || []);
      return response.data;
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudents([]);
      return null;
    }
  }, []);

  // Handle manual student sign-in
  const handleManualSignIn = async () => {
    if (!selectedStudentID) {
      alert("Please select a student");
      return;
    }

    try {
      setIsSubmitting(true);
      const author_id = Number(localStorage.getItem("userId"));
      const lecture_id = getLectureId();

      if (!lecture?.secret_number) {
        throw new Error("Secret number not available");
      }

      await POST("api/sign-manually-for-attendence", {
        author_id,
        lecture_id,
        student_id: selectedStudentID,
        secret_number: lecture.secret_number
      });

      // Show success message and refresh attendance data
      setManualSignInSuccess(true);
      setTimeout(() => setManualSignInSuccess(false), 3000);
      
      // Refresh attendance list
      await fetchAttendance();
      
      // Reset selection
      setSelectedStudentID(null);
    } catch (error) {
      console.error("Error signing in student:", error);
      alert("Failed to sign in student. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle attendance cancellation
  const handleAttendanceCancelling = async (id: number) => {
    try {
      setIsRemoving(id);
      await DELETE(`api/cancel-attendance/${id}`, {});
      await fetchAttendance();
    } catch (error) {
      console.error("Error cancelling attendance:", error);
      alert("Failed to remove student attendance. Please try again.");
    } finally {
      setIsRemoving(null);
    }
  };

  // Handle status change for attendance validation
  const handleStatusChange = async () => {
    try {
      setIsChangingStatus(true);
      const lectureID = getLectureId();
      await POST(`api/lecture-statues-change/${lectureID}`);
      await fetchLecture();
    } catch (error) {
      console.error("Error changing lecture status:", error);
      alert("Failed to change lecture status. Please try again.");
    } finally {
      setIsChangingStatus(false);
    }
  };

  // Format date string for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(new Date(dateString));
    } catch (e) {
      return dateString;
    }
  };

  // Format time for display
  const formatTime = (timeString?: string) => {
    if (!timeString) return "";
    try {
      return new Date(`1970-01-01T${timeString}`).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return timeString;
    }
  };

  // Load all data on component mount
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setIsLoading(true);
        await Promise.all([
          fetchLecture(),
          fetchAttendance(),
          fetchStudents()
        ]);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, [fetchLecture, fetchAttendance, fetchStudents]);

// حالة التحميل
if (isLoading) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4" dir="rtl">
      <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
      <p className="text-lg text-gray-600">جاري تحميل معلومات المحاضرة...</p>
    </div>
  );
}

// حالة الخطأ
if (error || !lecture) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="bg-red-100 border-r-4 border-red-500 text-red-700 p-4 rounded-md">
        <p className="font-bold">خطأ</p>
        <p>{error || "فشل في تحميل معلومات المحاضرة"}</p>
      </div>
    </div>
  );
}

// تصفية الطلاب الذين لم يسجلوا حضورهم بعد
const availableStudents = students.filter(student => 
  !attendees.some(attendee => attendee.student.id === student.id)
);

return (
  <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* الترويسة */}
        <div className="bg-gradient-to-l from-blue-600 to-blue-800 p-6 text-white">
          <h1 className="text-2xl md:text-3xl font-bold">{lecture.name}</h1>
          {lecture.description && (
            <p className="mt-2 text-blue-100">{lecture.description}</p>
          )}
        </div>
        
        {/* المحتوى */}
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:space-x-reverse md:space-x-8">
            {/* قسم تفاصيل المحاضرة */}
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">تفاصيل المحاضرة</h2>
              
              <div className="space-y-4">
                {lecture.date && (
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="ms-3">
                      <p className="font-medium text-gray-700">التاريخ والوقت</p>
                      <p className="text-gray-600">
                        {formatDate(lecture.date)} {lecture.time && formatTime(lecture.time)}
                      </p>
                    </div>
                    
                  </div>
                )}
                
                {lecture.location && (
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="ms-3">
                      <p className="font-medium text-gray-700">المكان</p>
                      <p className="text-gray-600">{lecture.location}</p>
                    </div>
                    
                  </div>
                )}
                
                {lecture.secret_number && (
                  <div className="flex items-start">
                    <Hash className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="ms-3">
                      <p className="font-medium text-gray-700">الرقم السري</p>
                      <p className="text-gray-600">{lecture.secret_number}</p>
                    </div>
                    
                  </div>
                )}
                
                {lecture.author_name && (
                  <div className="flex items-start">
                     <Users className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="ms-3">
                      <p className="font-medium text-gray-700">المُحاضر</p>
                      <p className="text-gray-600">{lecture.author_name}</p>
                    </div>
                   
                  </div>
                )}
                
                <div className="flex items-start">
                <Users className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="ms-3">
                    <p className="font-medium text-gray-700">الحضور</p>
                    <p className="text-gray-600">
                      {attendees.length} مسجل
                    </p>
                  </div>
                 
                </div>

                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                  <Hash className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="ms-3">
                      <p className="font-medium text-gray-700">حالة تسجيل الحضور</p>
                      <p className="text-gray-600">
                        {lecture.is_attendence_valid === 0 ? "غير نشط" : "نشط"}
                      </p>
                    </div>
                    
                  </div>
                  <button
                    onClick={handleStatusChange}
                    disabled={isChangingStatus}
                    className={`px-3 py-1 rounded-md text-white text-sm ${
                      isChangingStatus 
                        ? "bg-blue-400 cursor-not-allowed" 
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {isChangingStatus ? (
                      <span className="flex items-center">
                        <Loader2 className="h-3 w-3 animate-spin ml-1" />
                        جاري التغيير...
                      </span>
                    ) : (
                      "تغيير الحالة"
                    )}
                  </button>
                </div>

                {/* قسم تسجيل الحضور اليدوي */}
                <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">تسجيل حضور الطالب يدوياً</h3>
                  <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-reverse sm:space-x-3">
                    <div className="flex-grow m-0">
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        value={selectedStudentID ?? ""}
                        onChange={(e) => setSelectedStudentID(Number(e.target.value) || null)}
                      >
                        <option value="">اختر طالب</option>
                        {availableStudents.map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <button
                      className={`px-4 py-2 rounded-md text-white font-medium mr-2
                        ${isSubmitting || !availableStudents.length || !selectedStudentID
                          ? 'bg-blue-400 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                        }`}
                      onClick={handleManualSignIn}
                      disabled={isSubmitting || !availableStudents.length || !selectedStudentID}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center">
                          <Loader2 className="h-4 w-4 animate-spin ml-2" />
                          جاري المعالجة...
                        </span>
                      ) : (
                        "تسجيل الحضور"
                      )}
                    </button>
                  </div>
                  
                  {manualSignInSuccess && (
                    <div className="mt-3 flex items-center text-green-600">
                      <span>تم تسجيل حضور الطالب بنجاح!</span>
                      <CheckCircle className="h-4 w-4 mr-2" />
                    </div>
                  )}
                  
                  {availableStudents.length === 0 && (
                    <div className="mt-3 text-amber-600 text-sm">
                      تم تسجيل حضور جميع الطلاب بالفعل لهذه المحاضرة.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* قسم قائمة الحضور */}
          <div className="mt-10">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              الحاضرون ({attendees.length})
            </h2>
            
            {attendees.length > 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          الاسم
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          البريد الإلكتروني
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          الوقت
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          الإجراءات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attendees.map((attendee) => (
                        <tr key={attendee.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {attendee.student.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {attendee.student.email || "غير متوفر"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(attendee.date).toLocaleString('ar-IQ', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-left text-sm">
                            <button 
                              onClick={() => handleAttendanceCancelling(attendee.id)}
                              className="text-red-600 hover:text-red-900 focus:outline-none flex items-center justify-start space-x-reverse space-x-1"
                              disabled={isRemoving === attendee.id}
                            >
                              {isRemoving === attendee.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <X className="h-4 w-4" />
                                  <span>إزالة</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-6 text-center rounded-lg border border-gray-200">
                <p className="text-gray-500">لم يتم تسجيل أي حاضر بعد</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* التذييل */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>رقم المحاضرة: {lecture.id}</p>
      </div>
    </div>
  </div>
);
};