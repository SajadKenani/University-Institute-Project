import { Users, BookOpen, FileText, Menu, ChevronDown, Plus } from "lucide-react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setActiveTab, setShowAddClassForm, setShowAddForm, setShowCSVUploadForm } from "../../redux/actions";

export const HEADERNAV = () => {
    const [mobileMenu, setMobileMenu] = useState<boolean>(false);
    const activeTab = useSelector((state: any) => state.reducer.activeTab);
    const dispatch = useDispatch();
    
    return (
        <div className="flex flex-col mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div className="flex items-center mb-4 md:mb-0">
              {activeTab === 'students' ? (
                <Users className="text-indigo-600 ml-3" size={24} />
              ) : (
                <BookOpen className="text-emerald-600 ml-3" size={24} />
              )}
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {activeTab === 'students' ? 'إدارة الطلاب' : 'إدارة الفصول'}
              </h1>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {activeTab === 'students' && (
                <button
                  onClick={() => dispatch(setShowCSVUploadForm(true))}
                  className="w-full sm:w-auto px-4 lg:px-6 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center p-2 
                  rounded-full shadow-md transition-all transform hover:scale-105 mb-2 sm:mb-0"
                >
                  <FileText size={18} className="ml-1" />
                  <span className="text-sm">اضافة عن طريق الـ CSV</span>
                </button>
              )}
              
              <div className="relative">
                <button
                  onClick={() => setMobileMenu(!mobileMenu)}
                  className="md:hidden flex items-center justify-center p-2 bg-gray-100 rounded-lg"
                >
                  <Menu size={18} className="ml-1" />
                  <span className="text-sm">القائمة</span>
                  <ChevronDown size={16} className="mr-1" />
                </button>
                
                {mobileMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg z-10 md:hidden overflow-hidden">
                    <button
                      onClick={() => {
                        setActiveTab('students');
                        setMobileMenu(false);
                      }}
                      className={`w-full p-3 text-right ${activeTab === 'students' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center">
                        <Users size={16} className="ml-2" />
                        <span className="text-sm">الطلاب</span>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('classes');
                        setMobileMenu(false);
                      }}
                      className={`w-full p-3 text-right ${activeTab === 'classes' ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center">
                        <BookOpen size={16} className="ml-2" />
                        <span className="text-sm">الفصول</span>
                      </div>
                    </button>
                    <div className="border-t border-gray-100 p-2">
                      {activeTab === 'students' ? (
                        <button
                          onClick={() => {
                            dispatch(setShowAddForm(true));
                            setMobileMenu(false);
                          }}
                          className="w-full p-2 bg-indigo-600 text-white rounded-md flex items-center justify-center"
                        >
                          <Plus size={16} className="ml-1" />
                          <span className="text-sm">إضافة طالب</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            dispatch(setShowAddClassForm(true));
                            setMobileMenu(false);
                          }}
                          className="w-full p-2 bg-emerald-600 text-white rounded-md flex items-center justify-center"
                        >
                          <Plus size={16} className="ml-1" />
                          <span className="text-sm">إضافة فصل</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="hidden md:flex p-1 bg-gray-100 rounded-lg ml-4">
                <button
                  onClick={() => dispatch(setActiveTab('students'))}
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
                  onClick={() => dispatch(setActiveTab('classes'))}
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
              
              <div className="hidden md:block">
                {activeTab === 'students' ? (
                  <button
                    onClick={() => dispatch(setShowAddForm(true))}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center p-2 
                    rounded-full shadow-md transition-all transform hover:scale-105"
                  >
                    <Plus size={18} className="m-2" />
                  </button>
                ) : (
                  <button
                    onClick={() => dispatch(setShowAddClassForm(true))}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center p-2 
                    rounded-full shadow-md transition-all transform hover:scale-105"
                  >
                    <Plus size={18} className="m-2" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
    )
}