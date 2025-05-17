import { BookOpen, Search, Plus, Trash2 } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { setClassSearchTerm, setShowAddClassForm } from "../../../redux/actions"
import useFetchHandlers from "../../APIs"
import { useEffect, useState } from "react"
import LoadingSpinner from "../loading"

export const CLASSESTAB = () => {
  const classes = useSelector((state: any) => state.reducer.classes)
  const classSearchTerm = useSelector((state: any) => state.reducer.classSearchTerm)

  const [loadingClasses, setLoadingClasses] = useState(false);


  const getColorClass = (index: number) => {
    return colorClasses[index % colorClasses.length];
  };

  const filteredClasses = classes.filter((cls: any) =>
    cls.name?.toLowerCase().includes(classSearchTerm.toLowerCase())
  );

  const dispatch = useDispatch()
  const {
    HandleClassDeletion,
    HandleClassesFetching,
  } = useFetchHandlers({ setLoadingClasses });

  useEffect(() => {
    HandleClassesFetching()
  }, [])

  console.log(loadingClasses)

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

  return (
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
              onChange={(e) => dispatch(setClassSearchTerm(e.target.value))}
              className="pr-10 w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none 
                      focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              placeholder="بحث عن فصول..."
            />
          </div>
        </div>
      </div>

      {/* محتوى الفصول */}
      <div className="p-6">
        {loadingClasses ? <LoadingSpinner
          size="sm"
          color="green"
          text="جار التحميل"
          duration={2000}
        /> : classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <BookOpen className="text-gray-400 mb-4" size={64} />
            <p className="text-gray-600 text-xl font-medium mb-2">لم يتم العثور على فصول</p>
            <p className="text-gray-500 mb-6">ابدأ بإضافة أول فصل</p>
            <button
              onClick={() => dispatch(setShowAddClassForm(true))}
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
        ) : (
          // عرض الشبكة
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredClasses.map((cls: any, index: any) => (
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
                    onClick={() => HandleClassDeletion(cls.id || 0)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}