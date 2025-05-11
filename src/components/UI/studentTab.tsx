import { Users, Plus, Search, UserPlus, Trash2 } from "lucide-react";
import { setCounter, setSearchTerm, setShowAddForm } from "../../redux/actions";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {useCallback } from "react";
import { DELETE, POST, PUT } from "../Requests";

export const STUDENTTAB = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch()
    const students = useSelector((state: any) => state.reducer.students);
    const counter = useSelector((state: any) => state.reducer.counter);
    const searchTerm = useSelector((state: any) => state.reducer.searchTerm);

      const handleStudentDeletion = async (studentId: number) => {
        setLoading((prev: any) => ({ ...prev, insertingStudent: true }));
        try {
          await DELETE(`api/delete-student/${studentId}`);
        } catch (error) { console.log(error); }
        finally {
          setLoading((prev: any) => ({ ...prev, insertingStudent: false }));
          handleStudentsFetching();
        }
      };
    
      const handleSettingStudentsToClasses = useCallback(async (counter: number) => {
        setLoading((prev: any) => ({ ...prev, insertingClass: true }));
        try {
          await POST(`api/set-students-to-classes/${Number(counter)}`, {});
        } catch (error) { console.log(error); }
        finally {
          setLoading((prev: any) => ({ ...prev, insertingClass: false }));
          handleClassesFetching();
          handleStudentsFetching();
        }
      }, [handleClassesFetching, handleStudentsFetching]);
    
      const handleClassAdjustment = useCallback(async (student_id: number) => {
        setLoading((prev: any) => ({ ...prev, insertingClass: true }));
        try {
          await PUT(`api/update-class/${student_id}/${Number(selectedClass)}`, {});
        } catch (error) { console.log(error); }
        finally {
          handleStudentsFetching();
          handleClassesFetching();
          setLoading((prev: any) => ({ ...prev, insertingClass: false }));
        }
      }, [selectedClass, handleStudentsFetching, handleClassesFetching]);
      
      const filteredStudents = students.filter((student: { name: string; email: string; }) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );

    return (
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            {/* Search bar */}
            <div className="bg-indigo-600 p-3 sm:p-4 flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-2 text-white mb-3 md:mb-0 w-full md:w-auto">
                <Users size={20} />
                <h2 className="text-lg sm:text-xl font-semibold mr-2">الطلاب</h2>
                <span className="bg-white text-indigo-600 px-2 sm:px-3 py-1 rounded-full text-sm font-medium">
                  {students.length}
                </span>
              </div>
              
              <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto mb-3 md:mb-0">
                <input
                  type="number"
                  value={counter}
                  onChange={(e) => dispatch(setCounter(Number(e.target.value)))}
                  className="w-16 sm:w-20 px-2 sm:px-4 py-2 rounded-full border border-gray-300 
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 
                    text-gray-700 text-sm bg-white"
                  placeholder="العدد"
                />

                <button
                  onClick={() => dispatch(handleSettingStudentsToClasses(counter))}
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
                  onChange={(e) => dispatch(setSearchTerm(e.target.value))}
                  className="pr-10 w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none 
                    focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  placeholder="بحث عن طلاب..."
                />
              </div>
            </div>

            {/* Students list */}
            {loading.fetchingStudents ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
              </div>
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 sm:p-16 text-center">
                <Users className="text-gray-400 mb-4" size={48} />
                <p className="text-gray-600 text-lg sm:text-xl font-medium mb-2">لم يتم العثور على طلاب</p>
                <p className="text-gray-500 mb-6">ابدأ بإضافة أول طالب</p>
                <button
                  onClick={() => dispatch(setShowAddForm(true))}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center px-4 py-2 rounded-lg"
                >
                  <UserPlus size={20} className="ml-2" />
                  <span>إضافة طالب</span>
                </button>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center">
                <Search className="text-gray-400 mb-4" size={48} />
                <p className="text-gray-500 text-lg">لا يوجد طلاب مطابقين</p>
                <p className="text-gray-400 text-sm mt-2">جرب مصطلح بحث مختلف</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Mobile view - card style for small screens */}
                <div className="sm:hidden">
                  {filteredStudents.map((student: { id: Key | null | undefined; name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; email: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; class: any; }) => (
                    <div 
                      key={student.id} 
                      className="border-b border-gray-200 p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-gray-800">{student.name}</h3>
                          <p className="text-sm text-gray-600">{student.email}</p>
                        </div>
                        <div className="flex">
                          <button 
                            className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-full"
                            onClick={() => handleStudentDeletion(student.id || 0)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">الفصل:</span> {student.class || 'غير معين'}
                        </p>
                        <div className="flex flex-col space-y-2 mt-3">
                          <div className="flex items-center space-x-2">
                            <select
                              className="flex-1 p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              onChange={(event) => {
                                const value = Number(event.target.value);
                                setSelectedClass(value);
                              }}
                            >
                              <option value="">اختر فصلاً</option>
                              {classes?.length > 0 &&
                                classes.map((item: { id: Key | readonly string[] | null | undefined; name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }) => (
                                  <option key={item.id} value={item.id}>
                                    {item.name}
                                  </option>
                                ))}
                            </select>
                            <button
                              onClick={() => handleClassAdjustment(Number(student.id))}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm whitespace-nowrap"
                            >
                              تعيين
                            </button>
                          </div>
                          <button
                            className="w-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 py-2 rounded-lg text-sm font-medium transition-colors"
                            onClick={() => {
                              localStorage.setItem("studentID", String(student.id));
                              navigate("student");
                            }}
                          >
                            عرض التفاصيل
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Desktop view - table style for larger screens */}
                <table className="hidden sm:table w-full border-collapse">
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
                    {filteredStudents.map((student: { id: Key | null | undefined; name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; email: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; class: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }) => (
                      <tr
                        key={student.id}
                        className="border-b hover:bg-indigo-50 transition-colors duration-150"
                      >
                        <td className="p-4 text-right font-medium text-gray-800">{student.name}</td>
                        <td className="p-4 text-right text-gray-600">{student.email}</td>
                        <td className="p-4 text-right text-gray-600">{student.class}</td>
                        <td className="p-4 align-end lg:w-64">
                          <div className="flex items-center justify-start space-x-2">
                            <select
                              className="w-full sm:w-40 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              onChange={(event) => {
                                const value = Number(event.target.value);
                                setSelectedClass(value);
                              }}
                            >
                              <option value="">اختر فصلاً</option>
                              {classes?.length > 0 &&
                                classes.map((item: { id: Key | readonly string[] | null | undefined; name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }) => (
                                  <option key={item.id} value={item.id}>
                                    {item.name}
                                  </option>
                                ))}
                            </select>
                            <button
                              onClick={() => handleClassAdjustment(Number(student.id))}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm whitespace-nowrap"
                            >
                              تعيين
                            </button>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center space-x-2">
                            <button
                              className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors mx-2"
                              onClick={() => {
                                localStorage.setItem("studentID", String(student.id));
                                navigate("student");
                              }}
                            >
                              عرض التفاصيل
                            </button>

                            <button 
                              className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg"
                              onClick={() => handleStudentDeletion(student.id || 0)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
    )
}