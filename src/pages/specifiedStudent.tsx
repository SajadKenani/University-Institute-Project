import React, { useState, useCallback, useEffect } from "react";
import { TrashIcon, BookOpen, Calendar } from "lucide-react";
import { toast } from "sonner";
import { DELETE, GET, POST } from "../components/Requests";

interface Subject {
  id: number;
  name: string;
  degree: number;
}

interface Registration {
  id?: number;
  student_id: number;
  class_id: number;
  lecture_name?: string;
  attendance_status?: boolean;
  date?: string;
  time?: string;
}

export const SPECIFIEDSTUDENT: React.FC = () => {
  // State for form inputs
  const [name, setName] = useState<string>("");
  const [degree, setDegree] = useState<string>("0");

  // State for fetched subjects and loading
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRegistrationsLoading, setIsRegistrationsLoading] = useState<boolean>(false);

  // Helper to get IDs from localStorage
  const getLocalStorageId = (key: string): number | null => {
    const value = localStorage.getItem(key);
    return value ? Number(value) : null;
  };

  // Fetch student subjects
  const handleStudentFetching = useCallback(async () => {
    try {
      setIsLoading(true);
      const studentId = getLocalStorageId("studentID");
      if (!studentId) {
        toast.error("No student ID found");
        return;
      }

      const response = await POST("api/fetch-subjects", { id: studentId });

      if (response?.data) {
        setSubjects(response.data);
      } else {
        toast.warning("No subjects found for this student");
      }
    } catch (error) {
      toast.error("Failed to fetch subjects", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Insert new subject
  const handleSubjectInsertion = useCallback(async () => {
    try {
      setIsSubmitting(true);

      // Validate inputs
      if (!name.trim() || Number(degree) <= 0) {
        toast.warning("Please enter a valid subject name and degree");
        return;
      }

      const userId = getLocalStorageId("userId");
      const studentId = getLocalStorageId("studentID");

      if (!userId || !studentId) {
        toast.error("User or student ID is missing");
        return;
      }

      const response = await POST("api/insert-subject", {
        author_id: userId,
        student_id: studentId,
        name: name.trim(),
        degree: Number(degree),
      });

      if (response) {
        setName("");
        setDegree("0");
        toast.success("Subject added successfully");
        handleStudentFetching();
      }
    } catch (error) {
      toast.error("Failed to insert subject", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [name, degree, handleStudentFetching]);

  // Delete subject
  const handleSubjectDeletion = useCallback(
    async (id: number) => {
      try {
        await DELETE(`api/delete-subject/${id}`, {});
        toast.success("Subject removed successfully");
        handleStudentFetching();
      } catch (error) {
        toast.error("Failed to delete subject", {
          description: error instanceof Error ? error.message : "Please try again.",
        });
      }
    },
    [handleStudentFetching]
  );

  // Fetch student registrations
  const handleStudentsRegistrationsFetching = useCallback(async () => {
    const studentID = getLocalStorageId("studentID");
    if (!studentID) {
      toast.error("No student ID found");
      return;
    }
    
    try {
      setIsRegistrationsLoading(true);
      const response = await GET(`api/fetch-students-registrations/${studentID}`);
      
      if (response?.data) {
        // Process registrations with additional details if needed
        const enhancedRegistrations = response.data.map((reg: Registration) => ({
          ...reg,
          attendance_status: false // Default value, can be updated if available from API
        }));
        
        setRegistrations(enhancedRegistrations);
      } else {
        setRegistrations([]);
      }
    } catch (error) {
      console.error("Error fetching registrations:", error);
      toast.error("Failed to fetch student registrations");
      setRegistrations([]);
    } finally {
      setIsRegistrationsLoading(false);
    }
  }, []);

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  // Fetch subjects and registrations on component mount
  useEffect(() => {
    handleStudentFetching();
    handleStudentsRegistrationsFetching();
  }, [handleStudentFetching, handleStudentsRegistrationsFetching]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* قسم إدارة المواد */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
            <BookOpen className="ml-2 text-blue-500" size={24} />
            إدارة المواد
          </h2>
  
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700">
                اسم المادة
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أدخل اسم المادة"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
  
            <div>
              <label htmlFor="degree" className="block mb-2 text-sm font-medium text-gray-700">
                الدرجة
              </label>
              <input
                id="degree"
                type="number"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                placeholder="أدخل الدرجة"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
  
            <button
              onClick={handleSubjectInsertion}
              disabled={isSubmitting}
              className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "جاري الإضافة..." : "إضافة مادة"}
            </button>
          </div>
  
          {isLoading ? (
            <div className="mt-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2">جاري تحميل المواد...</p>
            </div>
          ) : subjects.length > 0 ? (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">المواد الحالية</h3>
              <div className="bg-gray-50 rounded-md divide-y divide-gray-200">
                {subjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-grow">
                      <span className="font-medium text-gray-800">{subject.name}</span>
                      <span className="mr-4 text-sm text-gray-600">الدرجة: {subject.degree}</span>
                    </div>
                    <button
                      onClick={() => handleSubjectDeletion(subject.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      aria-label="حذف المادة"
                    >
                      <TrashIcon size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-8 text-center text-gray-500">لم يتم العثور على مواد.</p>
          )}
        </div>
  
        {/* قسم تسجيلات الفصول */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
            <Calendar className="ml-2 text-blue-500" size={24} />
            تسجيلات المحاضرات
          </h2>
  
          {isRegistrationsLoading ? (
            <div className="text-center text-gray-500 py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2">جاري تحميل التسجيلات...</p>
            </div>
          ) : registrations.length > 0 ? (
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المحاضرة
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {registrations.map((registration) => (
                    <tr key={registration.id || `${registration.student_id}-${registration.class_id}`}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {registration.lecture_name || `محاضرة رقم ${registration.class_id}`}
                        </div>
                        {registration.date && (
                          <div className="text-xs text-gray-500">{formatDate(registration.date)}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${registration.attendance_status ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {registration.attendance_status ? 'حضر' : 'مسجل'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد تسجيلات</h3>
              <p className="mt-1 text-sm text-gray-500">
                هذا الطالب غير مسجل في أي فصول.
              </p>
            </div>
          )}
  
          <div className="mt-6 text-sm text-gray-500">
            <p>
              ستظهر الفصول المسجلة هنا. لحضور فصل، يحتاج الطالب إلى إدخال الرقم السري للفصل.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};