import React, { JSX, useState } from "react";
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
import LoadingSpinner from "../components/UI/loading";

interface RootState {
  reducer: {
    activeTab: string;
    showAddForm: boolean;
    showAddClassForm: boolean;
    showCSVUploadForm: boolean;
    className: string;
  }
}

export const STUDENTS = (): JSX.Element => {
  const dispatch = useDispatch();
  const { 
    activeTab,
    showAddForm,
    showAddClassForm,
    showCSVUploadForm,
  } = useSelector((state: RootState) => state.reducer);

  const [loadingClasses, setLoadingClasses] = useState<boolean>(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [tempClassName, setTempClassName] = useState<string>("");
  
  const {
    HandleCSVSubmit,
    HandleClassInsertion
  } = useFetchHandlers({ setLoadingClasses, tempClassName, setTempClassName });

  const handleClassNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setTempClassName(e.target.value);
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    const formData = new FormData();
    formData.append('file', file);
    dispatch(setSCVForm(formData));
  };

  const handleSubmitCSV = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!csvFile) {
      // Show error notification to user
      alert("Please select a CSV file first");
      return;
    }
    HandleCSVSubmit(event);
  };

  const handleSubmitClass = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    console.log(tempClassName)
    
    if (!tempClassName || tempClassName.trim() === '') {
      // Show error notification to user
      alert("Please enter a class name");
      return;
    }
    HandleClassInsertion(event);
  };

  return (
    <div className="min-h-screen p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with navigation between tabs */}
        <HEADERNAV />

        {/* Tab Content */}
        {activeTab === 'students' && <STUDENTSTAB />}
        {activeTab === 'classes' && <CLASSESTAB />}
      </div>

      {/* Add Student Modal */}
      {showAddForm && <SHOWADDSTUDENT />}

      {/* CSV Upload Modal */}
      {showCSVUploadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          {loadingClasses ? (
            <LoadingSpinner />
          ) : (
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
              <div className="bg-indigo-600 p-4 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <FileText className="text-white" size={20} />
                  <h2 className="text-xl font-semibold text-white mr-2">رفع ملف CSV</h2>
                </div>
                <button
                  onClick={() => dispatch(setShowCSVUploadForm(false))}
                  className="text-white hover:bg-indigo-700 rounded-full p-1"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <form className="p-6 space-y-5" onSubmit={handleSubmitCSV}>
                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اختر ملف CSV
                  </label>
                  <input 
                    type="file" 
                    accept=".csv" 
                    onChange={handleCSVUpload} 
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0 file:text-sm file:font-semibold
                      file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => dispatch(setShowCSVUploadForm(false))}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 ml-3"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center p-2 
                      rounded-lg shadow-md transition-all"
                  >
                    ارسال
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Add Class Modal */}
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
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitClass} className="p-6 space-y-5">
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
                    value={tempClassName}
                    onChange={handleClassNameChange}
                    className="pr-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="اسم الفصل (مثل: رياضيات 101)"
                    required
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
                  className="px-4 py-2 rounded-lg text-white font-medium transition-all flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"
                >
                  <Plus size={18} className="ml-2" />
                  <span>إضافة فصل</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};