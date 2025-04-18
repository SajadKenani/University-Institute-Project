import { useCallback, useEffect, useState } from "react"
import { DELETE, GET, POST } from "../components/Requests"
import { Trash2, BookOpen, ChevronLeft, Plus, Loader2, BookCopy } from "lucide-react"
import { useNavigate } from "react-router-dom"

// Define TypeScript interface for Lecture
interface Lecture {
  id: number
  name: string
  season_id: number
  author_id: number
  qr_code: string
}

export const LECTURE = () => {
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [lectureName, setLectureName] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState<boolean>(false)
  const [seasonName, setSeasonName] = useState<string>("")

  const navigate = useNavigate()

  const fetchSeasonName = useCallback(async () => {
    const season_id = Number(localStorage.getItem("seasonId"))
    try {
      const response = await GET(`api/fetch-season/${season_id}`)
      setSeasonName(response.data?.name || "Current Season")
    } catch (error) {
      console.error("Failed to fetch season name:", error)
    }
  }, [])

  const fetchLectures = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const season_id = Number(localStorage.getItem("seasonId"))
    
    try {
      const response = await GET(`api/fetch-lectures/${season_id}`)
      console.log(response.data)
      setLectures(response.data)
    } catch (error) {
      console.error("Failed to fetch lectures:", error)
      setError("Failed to load lectures. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleLectureInsertion = useCallback(async (e: React.FormEvent) => {
    e?.preventDefault()
    setIsLoading(true)
    setError(null)
    
    const season_id = Number(localStorage.getItem("seasonId"))
    const author_id = Number(localStorage.getItem("userId"))
    
    if (!lectureName.trim()) {
      setError("Please enter a lecture name")
      setIsLoading(false)
      return
    }
    
    try {
      await POST(`api/create-lecture`, {
        season_id,
        author_id,
        name: lectureName
      })
      
      // Clear form, hide it, and refresh lectures list
      setLectureName("")
      setShowForm(false)
      fetchLectures()
    } catch (error) {
      console.error("Failed to create lecture:", error)
      setError("Failed to create lecture. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [lectureName, fetchLectures])

  const handleLectureRemove = useCallback(async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDeletingId(id)
    try {
      await DELETE(`api/delete-lecture/${id}`, {})
    } catch (error) {
      console.log(error)
      setError("Failed to delete lecture. Please try again.")
    } finally {
      fetchLectures()
      setIsDeletingId(null)
    }
  }, [fetchLectures])

  const goBackToSeasons = () => {
    navigate("/seasons")
  }

  useEffect(() => {
    fetchLectures()
    fetchSeasonName()
  }, [fetchLectures, fetchSeasonName])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header with breadcrumb and actions */}
      <div className="mb-8">
        <div className="flex items-center text-gray-500 mb-2">
          <button 
            onClick={goBackToSeasons}
            className="flex items-center text-sm hover:text-indigo-600 transition duration-200"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span>الرجوع الى المواسم</span>
          </button>
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">المحاضرات</h2>
            {seasonName && (
              <p className="text-gray-600 mt-1"> {seasonName} :الموسم</p>
            )}
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center px-5 py-2 rounded-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 
              focus:ring-offset-2 ${
              showForm 
                ? "bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-400" 
                : "bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500"
            }`}
          >
            {showForm ? (
              "الغاء"
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                اضافة محاضرة جديدة
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow animate-fade-in">
          <div className="flex">
            <div className="py-1">
              <svg className="w-6 h-6 mr-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>{error}</div>
          </div>
        </div>
      )}
      
      {/* Lecture Form - only shows when showForm is true */}
      {showForm ? (
        <div className="bg-white shadow-lg rounded-lg p-8 mb-8 border border-gray-200 animate-fade-in">
          <h3 className="text-xl font-semibold mb-6 text-gray-800">اضافة محاضرة جديدة</h3>
          <form onSubmit={handleLectureInsertion} className="space-y-6">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lectureName">
                اسم المحاضرة
              </label>
              <input
                type="text"
                id="lectureName"
                className="shadow-sm border border-gray-300 rounded-md w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={lectureName}
                onChange={(e) => setLectureName(e.target.value)}
                placeholder="ادخل اسم المحاضرة"
                autoFocus
                required
              />
            </div>
            
            <div className="flex items-center justify-end">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg shadow-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  "حفظ المحاضرة"
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Lectures List - only shows when form is hidden */
        <div className="animate-fade-in">
          {isLoading && !lectures.length ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow-md">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
              <p className="text-gray-600">جار تحميل المحاضرات...</p>
            </div>
          ) : lectures?.length === 0 || lectures === null ? (
            <div className="bg-white shadow-md rounded-lg p-8 text-center">
              <div className="py-12">
                <BookOpen className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">لايوجد محاضرات</h3>
                <p className="mt-2 text-gray-500">ابدأ بأضافة محاضرتك الجديدة</p>
                <button 
                  onClick={() => setShowForm(true)}
                  className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg shadow-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center mx-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  اضافة اول محاضرة
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {lectures.map((lecture: Lecture) => (
                <div 
                  key={lecture.id} 
                  className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer group"
                  onClick={() => {
                    localStorage.setItem("lectureID", String(lecture.id)); 
                    navigate("/seasons/lecture/specified");
                  }}
                >
                  <div className="h-2 bg-indigo-600"></div>
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                   
                      <button
                        onClick={(e) => handleLectureRemove(lecture.id, e)}
                        className="mr-2 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors duration-200"
                        disabled={isDeletingId === lecture.id}
                      >
                        {isDeletingId === lecture.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                      <div className="flex items-center">
                      <h4 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors duration-300 line-clamp-2">
                          {lecture.name}
                        </h4>
                        <BookCopy className="w-5 h-5 text-indigo-600 ml-3" />
                       
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end mt-6">
                      <div className="text-indigo-600 text-sm font-medium flex items-center">
                        عرض المحاضرة
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}