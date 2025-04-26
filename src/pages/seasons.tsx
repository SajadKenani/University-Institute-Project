import { useCallback, useState, useEffect } from "react"
import { DELETE, GET, POST } from "../components/Requests"
import { useNavigate } from "react-router-dom"

// Define TypeScript interface for Season
interface Season {
  id: number
  name: string
  subject: string
  season_number: number
}

export const SEASONS = () => {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [seasonName, setSeasonName] = useState<string>("")
  const [subjectName, setSubjectName] = useState<string>("")
  const [seasonNumber, setSeasonNumber] = useState<number>(1)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState<boolean>(false)

  const navigation = useNavigate()

  const fetchSeasons = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const author_id = Number(localStorage.getItem("userId"))

    try {
      const response = await GET(`api/fetch-seasons/${author_id}`)
      setSeasons(response.data)
    } catch (error) {
      console.error("Failed to fetch seasons:", error)
      setError("Failed to load seasons. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSeasons()
  }, [fetchSeasons])

  const handleSeasonInsertion = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const author_id = Number(localStorage.getItem("userId"))

    if (!seasonName || !subjectName || seasonNumber <= 0) {
      setError("Please fill in all fields correctly")
      setIsLoading(false)
      return
    }

    try {
      await POST(`api/create-season`, {
        author_id,
        name: seasonName,
        subject: subjectName,
        season_number: seasonNumber
      })

      // Clear form, hide it, and refresh seasons list
      setSeasonName("")
      setSubjectName("")
      setSeasonNumber(1)
      setShowForm(false)
      fetchSeasons()
    } catch (error) {
      console.error("Failed to create season:", error)
      setError("Failed to create season. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [seasonName, subjectName, seasonNumber, fetchSeasons])

  const handleSeasonSelection = (season_id: number) => {
    localStorage.setItem("seasonId", String(season_id))
    navigation("lecture")
  }

  const handleSeasonRemoving = async (season_id: number) => {
    setIsLoading(true)
    setError(null)

    try {
      await DELETE(`api/delete-season/${season_id}`)
      fetchSeasons()
    } catch (error) {
      console.error("Failed to delete season:", error)
      setError("Failed to delete season. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">المواسم</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`px-5 py-2 rounded-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${showForm
              ? "bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-400"
              : "bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500"
            }`}
        >
          {showForm ? "إلغاء" : "إضافة موسم جديد"}
        </button>
      </div>

      {/* رسالة الخطأ */}
      {error && (
        <div className="bg-red-100 border-r-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow">
          <div className="flex">
            <div className="py-1">
              <svg className="w-6 h-6 ml-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* نموذج الموسم - يظهر فقط عندما تكون showForm صحيحة */}
      {showForm ? (
        <div className="bg-white shadow-lg rounded-lg p-8 mb-8 border border-gray-200">
          <h3 className="text-xl font-semibold mb-6 text-gray-800">إضافة موسم جديد</h3>
          <form onSubmit={handleSeasonInsertion} className="space-y-6">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="seasonName">
                اسم الموسم
              </label>
              <input
                type="text"
                id="seasonName"
                className="shadow-sm border border-gray-300 rounded-md w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={seasonName}
                onChange={(e) => setSeasonName(e.target.value)}
                placeholder="أدخل اسم الموسم"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="subjectName">
                المادة
              </label>
              <input
                type="text"
                id="subjectName"
                className="shadow-sm border border-gray-300 rounded-md w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="أدخل اسم المادة"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="seasonNumber">
                رقم الموسم
              </label>
              <input
                type="number"
                id="seasonNumber"
                className="shadow-sm border border-gray-300 rounded-md w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={seasonNumber}
                onChange={(e) => setSeasonNumber(Number(e.target.value))}
                min="1"
                required
              />
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg shadow-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -mr-1 ml-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري الإضافة...
                  </span>
                ) : (
                  "حفظ الموسم"
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* قائمة المواسم - تظهر فقط عندما يكون النموذج مخفيًا */
        <div>
          {isLoading && !seasons.length ? (
            <div className="flex justify-center items-center py-16">
              <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : seasons?.length === 0 || seasons === null ? (
            <div className="bg-white shadow-md rounded-lg p-8 text-center">
              <div className="py-8">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">لم يتم العثور على مواسم</h3>
                <p className="mt-2 text-gray-500">ابدأ بإنشاء موسمك الأول.</p>
                {!showForm && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg shadow-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    إنشاء موسمك الأول
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {seasons.map((season: Season) => (
                <div
                  key={season.id}
                  className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
                  onClick={() => handleSeasonSelection(season.id)}
                >
                  <div className="h-2 bg-indigo-600"></div>
                  <div className="p-6">
                    <h4 className="text-xl font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors duration-300 text-right">{season.name}</h4>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-start text-gray-600">
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                        </svg>
                        <span className="text-left"> المادة:  <span className="font-medium">{season.subject}</span> </span>
                      </div>
                      <div className="flex justify-start text-gray-600">
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path>
                        </svg>
                        <span> الموسم: {season.season_number}#</span>
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSeasonRemoving(season.id);
                        }}
                        className="flex items-center px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      >
                        <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}