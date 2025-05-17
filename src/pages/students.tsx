import React, { useEffect, useState } from "react";
import {
  Plus,
  X,
  BookOpen,
  FileText,
 
} from "lucide-react";
import { setSCVForm, setShowAddClassForm, setShowCSVUploadForm } from "../redux/actions";
import { useDispatch, useSelector } from "react-redux";
import { HEADERNAV } from "../components/UI/headerNav";
import { STUDENTSTAB } from "../components/UI/tabs/students";
import useFetchHandlers from "../components/APIs";
import { CLASSESTAB } from "../components/UI/tabs/classes";
import { SHOWADDSTUDENT } from "../components/UI/forms/showAddStudent";


export const STUDENTS = () => {

  const [className, setClassName] = useState<string>("");

  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const activeTab = useSelector((state: any) => state.reducer.activeTab);
  const showAddForm = useSelector((state: any) => state.reducer.showAddForm);
  const showAddClassForm = useSelector((state: any) => state.reducer.showAddClassForm);
  const showCSVUploadForm = useSelector((state: any) => state.reducer.showCSVUploadForm);
  const dispatch = useDispatch();

  const {
    HandleStudentsFetching, 
    HandleCSVSubmit,
    HandleClassInsertion
} = useFetchHandlers({setLoadingClasses, setLoadingStudents});

  const handleClassNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClassName(e.target.value);
  };

  const handleCSVUpload = async (event: any) => {
    event.preventDefault();
    // Handle CSV upload logic here
    const file = event.target.files[0];

    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    dispatch(setSCVForm(formData));
  };

  useEffect(() => {
    HandleStudentsFetching();
  }, [HandleStudentsFetching]);

  return (
    <div className="min-h-screen p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with navigation between tabs */}
        <HEADERNAV />

        {/* Students Tab Content */}
        {activeTab === 'students' && (
          <STUDENTSTAB />
        )}

         {/* محتوى تبويب الفصول */}
         {activeTab === 'classes' && (
          <CLASSESTAB />
        )}
      </div>

      {/* نافذة إضافة طالب */}
      {showAddForm && (
        <SHOWADDSTUDENT />
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
                onClick={() => dispatch(setShowCSVUploadForm(false))}
                className="text-white hover:bg-indigo-700 rounded-full p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* محتوى رفع ملف CSV */}
            <form className="p-6 space-y-5">
              <input type="file" accept=".csv" onChange={handleCSVUpload} />
              <button
                onClick={(event) => HandleCSVSubmit(event)}
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
                onClick={() => dispatch(setShowAddClassForm(false))}
                className="text-white hover:bg-emerald-700 rounded-full p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={HandleClassInsertion} className="p-6 space-y-5">
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


              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => dispatch(setShowAddClassForm(false))}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 ml-3"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg text-white font-medium transition-all flex items-center
                     justify-center
            
                    bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800
                   `}
                >
                
                    <>
                      <Plus size={18} className="ml-2" />
                      <span>إضافة فصل</span>
                    </>
                 
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};