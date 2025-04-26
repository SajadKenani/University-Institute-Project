import React, { useCallback, useEffect, useState } from "react";
import { DELETE, GET, getToken, POST, PUT } from "../components/Requests";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserPlus,
  Mail,
  Lock,
  User,
  Search,
  AlertCircle,
  Plus,
  X,
  BookOpen,
  Grid,
  List,
  Edit,
  Trash2,
  FileText
} from "lucide-react";
import { HandleLogin } from "../components/Auth";

interface Student {
  id?: number;
  name: string;
  email: string;
  password: string;
  class: string;
}

interface Class {
  id?: number;
  name?: string;
}

export const STUDENTS = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [newStudent, setNewStudent] = useState<Student>({
    name: "",
    email: "",
    password: "",
    class: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [classSearchTerm, setClassSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddClassForm, setShowAddClassForm] = useState(false);
  const [loading, setLoading] = useState({
    fetchingStudents: false,
    fetchingClasses: false,
    insertingStudent: false,
    insertingClass: false
  });
  const [className, setClassName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [classError, setClassError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'students' | 'classes'>('students');
  const [classViewMode, setClassViewMode] = useState<'grid' | 'list'>('grid');
  const [counter, setCounter] = useState<number>(0)
  const [selectedClass, setSelectedClass] = useState<number>(0)

  const [SCVForm, setSCVForm] = useState<any>(null)

  const [showCSVUploadForm, setShowCSVUploadForm] = useState<boolean>(false);

  const navigate = useNavigate();

  const handleStudentsFetching = useCallback(async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError("User not authenticated");
      return;
    }

    setLoading(prev => ({ ...prev, fetchingStudents: true }));
    setError(null);

    try {
      const response = await GET(`api/fetch-student-accounts/${Number(userId)}`);

      if (response.data && Array.isArray(response.data)) {
        setStudents(response.data);
      } else {
        setError("Invalid response format");
      }
    } catch (error) {
      console.error(error);
      setError("Failed to fetch students");
    } finally {
      setLoading(prev => ({ ...prev, fetchingStudents: false }));
    }
  }, []);

  const handleClassesFetching = useCallback(async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setClassError("User not authenticated");
      return;
    }

    setLoading(prev => ({ ...prev, fetchingClasses: true }));
    setClassError(null);

    try {
      const response = await GET(`api/fetch-classes/${Number(userId)}`);

      if (response.data && Array.isArray(response.data)) {
        setClasses(response.data);
      } else {
        setClassError("Invalid response format");
      }
    } catch (error) {
      console.error(error);
      setClassError("Failed to fetch classes");
    } finally {
      setLoading(prev => ({ ...prev, fetchingClasses: false }));
    }
  }, []);

  const handleStudentInsertion = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = localStorage.getItem('userId');

    if (!userId) {
      setError("User not authenticated");
      return;
    }

    // Validation
    if (!newStudent.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!newStudent.email.trim() || !newStudent.email.includes('@')) {
      setError("Valid email is required");
      return;
    }

    if (newStudent.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(prev => ({ ...prev, insertingStudent: true }));
    setError(null);

    try {
      const response = await POST("api/create-student-account", {
        name: newStudent.name.trim(),
        email: newStudent.email.trim(),
        password: newStudent.password,
        author_id: Number(userId)
      });

      if (response) {
        // Update local state
        setStudents(prev => [...prev, { ...newStudent, id: response?.data?.id ? response.data.id : 0 }]);

        // Reset form
        setNewStudent({
          name: "",
          email: "",
          password: "",
          class: ""
        });

        // Hide the form after successful submission
        setShowAddForm(false);
      } else {
        setError("Failed to create student account");
      }
    } catch (error) {
      console.error(error);
      setError("An error occurred while creating the account");
    } finally {
      setLoading(prev => ({ ...prev, insertingStudent: false }));
    }
  }, [newStudent]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewStudent(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClassNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClassName(e.target.value);
  };

  const handleClassInsertion = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = localStorage.getItem('userId');

    if (!userId) {
      setClassError("User not authenticated");
      return;
    }

    // Validation
    if (!className.trim()) {
      setClassError("Class name is required");
      return;
    }

    setLoading(prev => ({ ...prev, insertingClass: true }));
    setClassError(null);

    try {
      const response = await POST("api/insert-class", {
        name: className.trim(),
        author_id: Number(userId)
      });

      if (response) {
        // Update local state with the new class

        setClasses(prev => [...prev, { name: className.trim(), id: response?.data?.id ? response.data.id : 0 }]);

        // Reset form
        setClassName("");

        // Hide the form after successful submission
        setShowAddClassForm(false);
      } else {
        setClassError("Failed to create class");
      }
    } catch (error) {
      console.error(error);
      setClassError("An error occurred while creating the class");
    } finally {
      handleClassesFetching()
      setLoading(prev => ({ ...prev, insertingClass: false }));
    }
  }, [className]);

  const handleClassDeletion = async (classId: number) => {
    setLoading(prev => ({ ...prev, insertingClass: true }));
    try {
      await DELETE(`api/delete-class/${classId}`, {})
    } catch (error) { console.log(error) }
    finally {
      setLoading(prev => ({ ...prev, insertingClass: false }));
      handleClassesFetching()
    }
  }

  const handleStudentDeletion = async (studentId: number) => {
    setLoading(prev => ({ ...prev, insertingStudent: true }));
    try {
      await DELETE(`api/delete-student/${studentId}`)
    } catch (error) { console.log(error) }
    finally {
      setLoading(prev => ({ ...prev, insertingStudent: false }));
      handleStudentsFetching()
    }
  }

  const handleSettingStudentsToClasses = useCallback(async (counter: number) => {
    setLoading(prev => ({ ...prev, insertingClass: true }));
    try {
      await POST(`api/set-students-to-classes/${Number(counter)}`, {})
    } catch (error) { console.log(error) }
    finally {
      setLoading(prev => ({ ...prev, insertingClass: false }));
      handleClassesFetching()
      handleStudentsFetching()
    }
  }, [])

  const handleClassAdjustment = useCallback(async (student_id: number) => {
    setLoading(prev => ({ ...prev, insertingClass: true }));
    try {
      await PUT(`api/update-class/${student_id}/${Number(selectedClass)}`, {})

    } catch (error) { console.log(error) }
    finally {
      handleStudentsFetching()
      handleClassesFetching()
      setLoading(prev => ({ ...prev, insertingClass: false }));

    }
  }, [selectedClass])


  // Color palette for class cards
  const colorClasses = [
    'bg-blue-100 border-blue-300 text-blue-800',
    'bg-green-100 border-green-300 text-green-800',
    'bg-purple-100 border-purple-300 text-purple-800',
    'bg-pink-100 border-pink-300 text-pink-800',
    'bg-yellow-100 border-yellow-300 text-yellow-800',
    'bg-indigo-100 border-indigo-300 text-indigo-800',
    'bg-red-100 border-red-300 text-red-800',
    'bg-teal-100 border-teal-300 text-teal-800'
  ];

  const handleCSVUpload = async (event: any) => {
    event.preventDefault();
    // Handle CSV upload logic here
    const file = event.target.files[0];

    if (!file) return

    const formData = new FormData();
    formData.append('file', file);
    setSCVForm(formData)
  }

  const handleCSVSubmit = async (event: any) => {
    event.preventDefault();
    setLoading(prev => ({ ...prev, insertingClass: true }));
    let authToken = await getToken();

    if (!authToken) {
      await HandleLogin();
      authToken = await getToken();

      if (!authToken) {
        throw new Error("Unable to retrieve token after login.");
      }
    }

    const authorID = localStorage.getItem('userId')

    if (!authorID) {
      setClassError("User not authenticated");
      return;
    }

    try {
      const res = await fetch(`http://localhost:8081/api/insert-via-csv/${authorID}`, {
        method: "POST",
        body: SCVForm,
        headers: {
          Authorization: `Bearer ${authToken}`,
        }

      });

      console.log(res)
    } catch (error) { console.log(error) }
    finally {
      setLoading(prev => ({ ...prev, insertingClass: false }));
      handleClassesFetching()
      handleStudentsFetching()
      setShowCSVUploadForm(false)
    }
  }


  const getColorClass = (index: number) => {
    return colorClasses[index % colorClasses.length];
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClasses = classes.filter(cls =>
    cls.name?.toLowerCase().includes(classSearchTerm.toLowerCase())
  );

  useEffect(() => {
    handleStudentsFetching();
    handleClassesFetching();
  }, [handleStudentsFetching, handleClassesFetching]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* رأس الصفحة مع التنقل بين التبويبات */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center mb-4 md:mb-0">
            {activeTab === 'students' ? (
              <Users className="text-indigo-600 ml-3" size={24} />

            ) : (
              <BookOpen className="text-emerald-600 ml-3" size={24} />
            )}
            <h1 className="text-2xl font-bold text-gray-900">
              {activeTab === 'students' ? 'إدارة الطلاب' : 'إدارة الفصول'}
            </h1>
          </div>
          {activeTab === 'students' &&
            <button
              onClick={() => setShowCSVUploadForm(true)}
              className="px-6 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center p-2 
                 rounded-full shadow-md transition-all transform hover:scale-105"
            >
              اضافة عن طريق الـ CSV
            </button>
          }

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0">
            <div className="flex p-1 bg-gray-100 rounded-lg ml-4">
              <button
                onClick={() => setActiveTab('students')}
                className={`px-4 py-2 rounded-md transition-all ${activeTab === 'students'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <div className="flex items-center">
                  <Users size={18} className="ml-2" />
                  <span>الطلاب</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('classes')}
                className={`px-4 py-2 rounded-md transition-all ${activeTab === 'classes'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <div className="flex items-center">
                  <BookOpen size={18} className="ml-2" />
                  <span>الفصول</span>
                </div>
              </button>
            </div>



            <div className="ml-2">
              {activeTab === 'students' ? (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center p-2 
                  rounded-full shadow-md transition-all transform hover:scale-105"
                  >
                    <Plus size={18} className="m-2" />
                  </button>

                </div>
              ) : (
                <button
                  onClick={() => setShowAddClassForm(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center p-2 
                  rounded-full shadow-md transition-all transform hover:scale-105"
                >
                  <Plus size={18} className="m-2" />
                </button>

              )}
            </div>

          </div>
        </div>

        {/* محتوى تبويب الطلاب */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            {/* شريط البحث */}
            <div className="bg-indigo-600 p-4 flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-2 text-white mb-3 md:mb-0">
                <Users size={20} />
                <h2 className="text-xl font-semibold mr-2">الطلاب</h2>
                <span className="bg-white text-indigo-600 px-3 py-1 rounded-full text-sm font-medium">
                  {students.length}
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-xl shadow-sm border-gray-200">
                <input
                  type="number"
                  value={counter}
                  onChange={(e) => setCounter(Number(e.target.value))}
                  className="w-20 px-4 py-2 rounded-full border border-gray-300 
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 
                    text-gray-700 text-sm bg-white"
                  placeholder="العدد"
                />

                <button
                  onClick={() => handleSettingStudentsToClasses(counter)}
                  className="bg-white hover:bg-white text-indigo-600 text-sm 
                    px-2 py-2 rounded-full shadow-md transition-all duration-200"
                >
                  <Plus />
                </button>
              </div>

              <div className="relative w-full md:w-72">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none 
                    focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  placeholder="بحث عن طلاب..."
                />
              </div>
            </div>

            {/* قائمة الطلاب */}
            {loading.fetchingStudents ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
              </div>
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-center">
                <Users className="text-gray-400 mb-4" size={64} />
                <p className="text-gray-600 text-xl font-medium mb-2">لم يتم العثور على طلاب</p>
                <p className="text-gray-500 mb-6">ابدأ بإضافة أول طالب</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center px-4 py-2 rounded-lg"
                >
                  <UserPlus size={20} className="ml-2" />
                  <span>إضافة طالب</span>
                </button>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Search className="text-gray-400 mb-4" size={48} />
                <p className="text-gray-500 text-lg">لا يوجد طلاب مطابقين</p>
                <p className="text-gray-400 text-sm mt-2">جرب مصطلح بحث مختلف</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-indigo-900">
                      <th className="p-4 text-right font-medium">الاسم</th>
                      <th className="p-4 text-right font-medium">البريد الإلكتروني</th>
                      <th className="p-4 text-right font-medium">الفصل</th>
                      <th className="p-4 text-right font-medium">تعيين الفصل</th>
                      <th className="p-4 text-right font-medium">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr
                        key={student.id}
                        className="border-b hover:bg-indigo-50 transition-colors duration-150"
                      >
                        <td className="p-4 text-right font-medium text-gray-800">{student.name}</td>
                        <td className="p-4 text-righttext-gray-600">{student.email}</td>
                        <td className="p-4 text-right text-gray-600">{student.class}</td>
                        <td className="p-4 align-end lg:w-100">
                          <div className="flex items-start justify-start space-x-2">
                            <select
                              className="w-40 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              onChange={(event) => {
                                const value = Number(event.target.value);
                                setSelectedClass(value);
                              }}
                            >
                              <option value="">اختر فصلاً</option>
                              {classes?.length > 0 &&
                                classes.map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.name}
                                  </option>
                                ))}
                            </select>
                            <button
                              onClick={() => handleClassAdjustment(Number(student.id))}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3  py-2 rounded-md text-sm"
                            >
                              تعيين
                            </button>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors mx-4"
                            onClick={() => {
                              localStorage.setItem("studentID", String(student.id));
                              navigate("student");
                            }}
                          >
                            عرض التفاصيل
                          </button>

                          <button className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            onClick={() => handleStudentDeletion(student.id || 0)}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* محتوى تبويب الفصول */}
        {activeTab === 'classes' && (
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            {/* شريط البحث وتبديل العرض */}
            <div className="bg-emerald-600 p-4 flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-2 text-white mb-3 md:mb-0">
                <BookOpen size={20} />
                <h2 className="text-xl font-semibold mr-2">الفصول</h2>
                <span className="bg-white text-emerald-600 px-3 py-1 rounded-full text-sm font-medium">
                  {classes.length}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="relative w-full md:w-64">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={classSearchTerm}
                    onChange={(e) => setClassSearchTerm(e.target.value)}
                    className="pr-10 w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none 
                      focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                    placeholder="بحث عن فصول..."
                  />
                </div>
                <div className="bg-emerald-700 rounded-full p-1 flex">
                  <button
                    onClick={() => setClassViewMode('grid')}
                    className={`p-1 rounded-full ${classViewMode === 'grid' ? 'bg-white text-emerald-600' : 'text-white'}`}
                  >
                    <Grid size={18} />
                  </button>
                  <button
                    onClick={() => setClassViewMode('list')}
                    className={`p-1 rounded-full ${classViewMode === 'list' ? 'bg-white text-emerald-600' : 'text-white'}`}
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* محتوى الفصول */}
            <div className="p-6">
              {loading.fetchingClasses ? (
                <div className="flex items-center justify-center p-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600"></div>
                  <span className="mr-3 text-gray-600">جاري تحميل الفصول...</span>
                </div>
              ) : classError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                  <span className="text-red-700">{classError}</span>
                </div>
              ) : classes.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 text-center">
                  <BookOpen className="text-gray-400 mb-4" size={64} />
                  <p className="text-gray-600 text-xl font-medium mb-2">لم يتم العثور على فصول</p>
                  <p className="text-gray-500 mb-6">ابدأ بإضافة أول فصل</p>
                  <button
                    onClick={() => setShowAddClassForm(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center px-4 py-2 rounded-lg"
                  >
                    <Plus size={20} className="ml-2" />
                    <span>إضافة فصل</span>
                  </button>
                </div>
              ) : filteredClasses.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <Search className="text-gray-400 mb-4" size={48} />
                  <p className="text-gray-500 text-lg">لا توجد فصول مطابقة</p>
                  <p className="text-gray-400 text-sm mt-2">جرب مصطلح بحث مختلف</p>
                </div>
              ) : classViewMode === 'grid' ? (
                // عرض الشبكة
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredClasses.map((cls, index) => (
                    <div
                      key={cls.id || index}
                      className={`border-2 rounded-xl p-5 flex flex-col shadow-sm hover:shadow-md transition-shadow ${getColorClass(index)}`}
                    >
                      <div className="flex-1 flex items-center justify-center mb-3">
                        <BookOpen size={32} />
                      </div>
                      <h3 className="text-center font-bold text-lg truncate">{cls.name}</h3>
                      <div className="mt-4 flex justify-center space-x-2">
                        <button className="p-1 rounded-full hover:bg-white hover:bg-opacity-50 transition-colors"
                          onClick={() => handleClassDeletion(cls.id || 0)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // عرض القائمة
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  {filteredClasses.map((cls, index) => (
                    <div
                      key={cls.id || index}
                      className={`p-4 ${index !== filteredClasses.length - 1 ? 'border-b border-gray-200' : ''} 
                        hover:bg-gray-50 flex justify-between items-center`}
                    >
                      <div className="flex items-center">
                        <div className={`p-2 rounded-full ml-3 ${getColorClass(index).split(' ')[0]}`}>
                          <BookOpen size={16} />
                        </div>
                        <span className="font-medium">{cls.name}</span>
                      </div>
                      <div className="flex space-x-2">
                        <button className="p-1 rounded-full hover:bg-gray-200 transition-colors">
                          <Edit size={16} className="text-gray-600" />
                        </button>
                        <button
                          className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                          onClick={() => handleClassDeletion(cls.id || 0)}
                        >
                          <Trash2 size={16} className="text-gray-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* نافذة إضافة طالب */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="bg-indigo-600 p-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <UserPlus className="text-white" size={20} />
                <h2 className="text-xl font-semibold text-white mr-2">إضافة طالب جديد</h2>
              </div>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-white hover:bg-indigo-700 rounded-full p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleStudentInsertion} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم الطالب
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={newStudent.name}
                    onChange={handleInputChange}
                    className="pr-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="الاسم الكامل"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={newStudent.email}
                    onChange={handleInputChange}
                    className="pr-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="student@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  كلمة المرور
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={newStudent.password}
                    onChange={handleInputChange}
                    className="pr-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="6 أحرف على الأقل"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 ml-2" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 ml-3"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading.insertingStudent}
                  className={`px-4 py-2 rounded-lg text-white font-medium transition-all flex items-center justify-center
                    ${loading.insertingStudent
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
                    }`}
                >
                  {loading.insertingStudent ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full ml-2"></div>
                      <span>جاري الإنشاء...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} className="ml-2" />
                      <span>إضافة طالب</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCSVUploadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="bg-indigo-600 p-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <FileText className="text-white" size={20} />
                <h2 className="text-xl font-semibold text-white mr-2">رفع ملف CSV</h2>
              </div>
              <button
                onClick={() => setShowCSVUploadForm(false)}
                className="text-white hover:bg-indigo-700 rounded-full p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* محتوى رفع ملف CSV */}
            <form className="p-6 space-y-5">
              <input type="file" accept=".csv" onChange={handleCSVUpload} />
              <button
                onClick={(event) => handleCSVSubmit(event)}
                className="px-6 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center p-2 
              rounded-full shadow-md transition-all transform hover:scale-105"
              >
                ارسال
              </button>
            </form>
          </div>
        </div>

      )}

      {/* نافذة إضافة فصل */}
      {showAddClassForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="bg-emerald-600 p-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <BookOpen className="text-white" size={20} />
                <h2 className="text-xl font-semibold text-white mr-2">إضافة فصل جديد</h2>
              </div>
              <button
                onClick={() => setShowAddClassForm(false)}
                className="text-white hover:bg-emerald-700 rounded-full p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleClassInsertion} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم الفصل
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <BookOpen className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="className"
                    value={className}
                    onChange={handleClassNameChange}
                    className="pr-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="اسم الفصل (مثل: رياضيات 101)"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 ml-2" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddClassForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 ml-3"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading.insertingClass}
                  className={`px-4 py-2 rounded-lg text-white font-medium transition-all flex items-center justify-center
                    ${loading.insertingClass
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                    }`}
                >
                  {loading.insertingClass ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full ml-2"></div>
                      <span>جاري الإنشاء...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={18} className="ml-2" />
                      <span>إضافة فصل</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};