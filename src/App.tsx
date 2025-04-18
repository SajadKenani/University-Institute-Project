import React, { useCallback, useEffect, useState } from 'react';
import { 
  createBrowserRouter, 
  RouterProvider, 
  Navigate, 
  useNavigate,
  Link,
  useLocation
} from 'react-router-dom';
import { ACCOUNTS } from './pages/accounts';
import { POST } from './components/Requests';
import { STUDENTS } from './pages/students';
import { SPECIFIEDSTUDENT } from './pages/specifiedStudent';
import { ANNOUNCEMENTS } from './pages/announcements';
import { Menu, X } from 'lucide-react'; // استيراد أيقونات للقائمة المنسدلة
import { VIDEOS } from './pages/videos';
import { SEASONS } from './pages/seasons';
import { LECTURE } from './pages/lecture';
import { SPECIFIEDLECTURE } from './pages/specifiedLecture';
import "./index.css"

// تحديد أدوار المستخدمين وصلاحياتهم
const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  ANNOUNCER: 'announcer'
};

// تحديد صلاحيات الوصول لكل مسار
const ROUTE_PERMISSIONS = {
  '/accounts': [ROLES.ADMIN],
  '/students': [ROLES.ADMIN, ROLES.TEACHER],
  '/students/student': [ROLES.ADMIN, ROLES.TEACHER],
  '/announcements': [ROLES.ADMIN, ROLES.TEACHER, ROLES.ANNOUNCER],
  '/videos': [ROLES.ADMIN],
  '/seasons': [ROLES.ADMIN, ROLES.TEACHER],
  '/seasons/lecture': [ROLES.ADMIN, ROLES.TEACHER],
  '/seasons/lecture/specified': [ROLES.ADMIN, ROLES.TEACHER]
};

// مكون تخطيط التنقل
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // حالة قائمة البرغر

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  const handleAccountFetching = useCallback(async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        navigate('/');
        return;
      }

      const response = await POST("api/handle-account-fetching", {
        id: Number(userId)
      });
      
      if (response?.data?.[0]?.role) {
        let role = response.data[0].role.toLowerCase();
        if (role === 'student') {
          role = 'announcer';
        }
        
        setUserRole(role);
        localStorage.setItem('userRole', role);
        
        if (!hasPermission(location.pathname, role)) {
          navigate('/announcements');
          setError("ليس لديك صلاحية للوصول إلى هذه الصفحة");
        }
      } else {
        setError("غير قادر على جلب دور المستخدم");
      }
    } catch (error) {
      console.error("خطأ في جلب الحساب:", error);
      setError("فشل في التحقق من حسابك");
    } finally {
      setLoading(false);
    }
  }, [location.pathname, navigate]);
  
  useEffect(() => {
    handleAccountFetching();
  }, [handleAccountFetching]);

  const hasPermission = (path: string, role: string) => {
    const basePath = path.split('?')[0];
    const allowedRoles = ROUTE_PERMISSIONS[basePath as keyof typeof ROUTE_PERMISSIONS];
    return allowedRoles ? allowedRoles.includes(role) : false;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-8 bg-white shadow-lg rounded-lg">
          <p className="text-xl">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" dir="rtl">
      {/* الشريط الجانبي للتنقل */}
      <div
        className={`fixed inset-y-0 right-0 bg-blue-700 text-white p-4 transform ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        } transition-transform duration-300 lg:translate-x-0 lg:static lg:w-64`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">لوحة التحكم</h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-white"
            aria-label="إغلاق الشريط الجانبي"
          >
            <X size={24} />
          </button>
        </div>
        <p className="text-sm text-gray-300 mb-4">
          الدور: {userRole ? (userRole === ROLES.ADMIN ? "مدير" : 
                            userRole === ROLES.TEACHER ? "تدريسي" : 
                            userRole === ROLES.ANNOUNCER ? "معلن" : "غير معروف") : "غير معروف"}
        </p>
        <nav className="space-y-4">
          {userRole === ROLES.ADMIN && (
            <Link 
              to="/accounts" 
              className="block py-2 px-4 rounded hover:bg-blue-700 transition duration-300"
            >
              الحسابات
            </Link>
          )}
          {userRole && hasPermission('/students', userRole) && (
            <Link 
              to="/students" 
              className="block py-2 px-4 rounded hover:bg-blue-700 transition duration-300"
            >
              الطلاب
            </Link>
          )}
          {userRole && hasPermission('/announcements', userRole) && (
            <Link 
              to="/announcements" 
              className="block py-2 px-4 rounded hover:bg-blue-700 transition duration-300"
            >
              الإعلانات
            </Link>
          )}
            {userRole && hasPermission('/videos', userRole) && (
            <Link 
              to="/videos" 
              className="block py-2 px-4 rounded hover:bg-blue-700 transition duration-300"
            >
              الفيديوهات
            </Link>
          )}
             {userRole && hasPermission('/seasons', userRole) && (
            <Link 
              to="/seasons" 
              className="block py-2 px-4 rounded hover:bg-blue-700 transition duration-300"
            >
              الفصول الدراسية
            </Link>
          )}
          <button 
            onClick={handleLogout}
            className="w-full text-right py-2 px-4 rounded hover:bg-red-700 transition duration-300 text-red-300 hover:text-white"
          >
            تسجيل الخروج
          </button>
        </nav>
      </div>

      {/* زر قائمة البرغر */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 bg-blue-800 text-white p-2 rounded-lg lg:hidden"
        aria-label="فتح الشريط الجانبي"
      >
        <Menu size={24} />
      </button>

      {/* منطقة المحتوى الرئيسية */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

// مكون تسجيل الدخول
const SignIn = () => {
  const [credentials, setCredentials] = useState({
    phone_number: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // مسح أي بيانات مستخدم مخزنة في صفحة تسجيل الدخول
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // التحقق من صحة رقم الهاتف
    const phoneRegex = /^[0-9]{11}$/;
    if (!phoneRegex.test(credentials.phone_number)) {
      setError('الرجاء إدخال رقم هاتف صحيح مكون من 11 رقمًا');
      setLoading(false);
      return;
    }

    try {
      const response = await POST('api/sign-in', {
        phone_number: credentials.phone_number, 
        password: credentials.password
      });
    
      if (response && response.value) {
        localStorage.setItem('userId', response.value);
        
        // الحصول على دور المستخدم مباشرة بعد تسجيل الدخول لتحديد المكان المراد التنقل إليه
        try {
          const userResponse = await POST("api/handle-account-fetching", {
            id: Number(response.value)
          });
          
          if (userResponse?.data?.[0]?.role) {
            // تعيين 'student' إلى 'announcer' إذا جاء من الخادم الخلفي
            let role = userResponse.data[0].role.toLowerCase();
            if (role === 'student') {
              role = 'announcer';
            }
            
            localStorage.setItem('userRole', role);
            
            // التنقل بناءً على الدور
            if (role === ROLES.ADMIN) {
              navigate('/accounts'); // المسؤولون يذهبون إلى صفحة الحسابات
            } else {
              navigate('/announcements'); // الأدوار الأخرى تذهب إلى الإعلانات
            }
          } else {
            navigate('/announcements'); // الافتراضي إذا لم يتمكن من تحديد الدور
          }
        } catch (err) {
          console.error("فشل في جلب دور المستخدم:", err);
          navigate('/announcements'); // الافتراضي في حالة وجود خطأ
        }
      } else {
        setError('رقم الهاتف أو كلمة المرور غير صحيحة');
      }
    } catch (err) {
      console.error(err);
      setError('حدث خطأ. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center px-4" dir="rtl">
      <div className="max-w-md w-full bg-white shadow-2xl rounded-2xl p-8 space-y-6">
        <h2 className="text-3xl font-bold text-center text-blue-800">
          تسجيل الدخول
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              رقم الهاتف
            </label>
            <input
              type="tel"
              name="phone_number"
              value={credentials.phone_number}
              onChange={handleInputChange}
              required
              maxLength={11}
              pattern="[0-9]{11}"
              className="w-full px-4 py-3 border border-blue-300 rounded-lg 
              focus:outline-none focus:ring-2 focus:ring-blue-500 
              transition duration-300 ease-in-out"
              placeholder="أدخل رقم الهاتف (11 رقم)"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              كلمة المرور
            </label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              required
              minLength={8}
              className="w-full px-4 py-3 border border-blue-300 rounded-lg 
              focus:outline-none focus:ring-2 focus:ring-blue-500 
              transition duration-300 ease-in-out"
              placeholder="أدخل كلمة المرور"
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 text-white rounded-lg 
            transition duration-300 ease-in-out 
            transform hover:scale-105 font-bold uppercase tracking-wider
            ${loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }`}
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
};

// مكون المسار المحمي المستند إلى الدور
const ProtectedRoute: React.FC<{ children: React.ReactNode, requiredRoles?: string[] }> = ({ 
  children, 
  requiredRoles = [] 
}) => {
  const isAuthenticated = !!localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');
  const navigate = useNavigate();
  
  useEffect(() => {
    // إذا كان المسار يتطلب أدوارًا محددة والمستخدم لا يملك الصلاحية
    if (requiredRoles.length > 0 && userRole && !requiredRoles.includes(userRole)) {
      navigate('/announcements');
    }
  }, [navigate, requiredRoles, userRole]);
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <Layout>{children}</Layout>;
};

// تكوين جهاز التوجيه
const router = createBrowserRouter([
  {
    path: '/',
    element: <SignIn />,
  },
  {
    path: '/accounts',
    element: (
      <ProtectedRoute requiredRoles={[ROLES.ADMIN]}>
        <ACCOUNTS />
      </ProtectedRoute>
    ),
  },
  {
    path: '/students',
    element: (
      <ProtectedRoute requiredRoles={[ROLES.ADMIN, ROLES.TEACHER]}>
        <STUDENTS />
      </ProtectedRoute>
    ),
  },
  {
    path: '/students/student',
    element: (
      <ProtectedRoute requiredRoles={[ROLES.ADMIN, ROLES.TEACHER]}>
        <SPECIFIEDSTUDENT />
      </ProtectedRoute>
    ),
  },
  {
    path: '/announcements',
    element: (
      <ProtectedRoute>
        <ANNOUNCEMENTS />
      </ProtectedRoute>
    ),
  },
  {
    path: '/videos',
    element: (
      <ProtectedRoute>
        <VIDEOS />
      </ProtectedRoute>
    ),
  },
  {
    path: '/seasons',
    element: (
      <ProtectedRoute>
        <SEASONS />
      </ProtectedRoute>
    ),
  },
  {
    path: '/seasons/lecture',
    element: (
      <ProtectedRoute>
        <LECTURE />
      </ProtectedRoute>
    ),
  },
  {
    path: '/seasons/lecture/specified',
    element: (
      <ProtectedRoute>
        <SPECIFIEDLECTURE />
      </ProtectedRoute>
    ),
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;