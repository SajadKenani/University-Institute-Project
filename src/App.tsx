import React, { useCallback, useEffect, useState, createContext } from 'react';
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
import { Menu, X, UserCircle } from 'lucide-react';
import { VIDEOS } from './pages/videos';
import { SEASONS } from './pages/seasons';
import { LECTURE } from './pages/lecture';
import { SPECIFIEDLECTURE } from './pages/specifiedLecture';
import "./index.css";

// Define types
interface UserResponse {
  data?: Array<{
    role: string;
    name?: string;
    [key: string]: any;
  }>;
  token?: string;
  value?: string | number;
  [key: string]: any;
}

interface Credentials {
  phone_number: string;
  password: string;
}

// User context
interface AuthContextType {
  userRole: string | null;
  userName: string | null;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  userRole: null,
  userName: null,
  isAuthenticated: false,
  logout: () => {}
});

// User roles definition
const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  ANNOUNCER: 'announcer'
} as const;

type RoleType = typeof ROLES[keyof typeof ROLES];

// Route access permissions
const ROUTE_PERMISSIONS: Record<string, RoleType[]> = {
  '/accounts': [ROLES.ADMIN],
  '/students': [ROLES.ADMIN, ROLES.TEACHER],
  '/students/student': [ROLES.ADMIN, ROLES.TEACHER],
  '/announcements': [ROLES.ADMIN, ROLES.TEACHER, ROLES.ANNOUNCER],
  '/videos': [ROLES.ADMIN],
  '/seasons': [ROLES.ADMIN, ROLES.TEACHER],
  '/seasons/lecture': [ROLES.ADMIN, ROLES.TEACHER],
  '/seasons/lecture/specified': [ROLES.ADMIN, ROLES.TEACHER]
};

// Convert role to Arabic display text
const getRoleDisplayName = (role: string | null): string => {
  if (!role) return "غير معروف";
  
  switch(role) {
    case ROLES.ADMIN: return "مدير";
    case ROLES.TEACHER: return "تدريسي";
    case ROLES.ANNOUNCER: return "معلن";
    default: return "غير معروف";
  }
};

// Error message component
const ErrorMessage: React.FC<{ message: string | null }> = ({ message }) => {
  if (!message) return null;
  
  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 animate-fadeIn">
      {message}
    </div>
  );
};

// Layout component
interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState<string | null>(localStorage.getItem('userRole'));
  const [userName, setUserName] = useState<string | null>(localStorage.getItem('userName') || null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const logout = useCallback(() => {
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    navigate('/', { replace: true });
  }, [navigate]);

  const handleAccountFetching = useCallback(async () => {
    try {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");
      
      if (!userId || !token) {
        logout();
        return;
      }

      const response: UserResponse = await POST("api/handle-account-fetching", {
        id: Number(userId)
      });
      
      if (response?.data?.[0]?.role) {
        let role = response.data[0].role.toLowerCase();
        
        // Convert 'student' to 'announcer'
        if (role === 'student') {
          role = 'announcer';
        }
        
        setUserRole(role);
        localStorage.setItem('userRole', role);
        
        // Store user name if available
        if (response.data[0].name) {
          setUserName(response.data[0].name);
          localStorage.setItem('userName', response.data[0].name);
        }
        
        // Check if user has permission for the current path
        if (!hasPermission(location.pathname, role)) {
          navigate('/announcements', { replace: true });
          setError("ليس لديك صلاحية للوصول إلى هذه الصفحة");
        }
      } else {
        setError("غير قادر على جلب دور المستخدم");
        logout();
      }
    } catch (error) {
      console.error("خطأ في جلب الحساب:", error);
      setError("فشل في التحقق من حسابك");
      setTimeout(() => logout(), 2000);
    } finally {
      setLoading(false);
    }
  }, [location.pathname, navigate, logout]);
  
  useEffect(() => {
    handleAccountFetching();
  }, [handleAccountFetching]);

  const hasPermission = (path: string, role: string): boolean => {
    const basePath = path.split('?')[0];
    const allowedRoles = ROUTE_PERMISSIONS[basePath];
    return allowedRoles ? allowedRoles.includes(role as RoleType) : false;
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Detect clicks outside the sidebar on mobile
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const sidebar = document.getElementById('sidebar');
      const menuButton = document.getElementById('menu-button');
      
      if (sidebar && 
          menuButton && 
          !sidebar.contains(event.target as Node) && 
          !menuButton.contains(event.target as Node) &&
          isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isSidebarOpen]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-8 bg-white shadow-lg rounded-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-xl">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      userRole, 
      userName, 
      isAuthenticated: !!localStorage.getItem('token'),
      logout 
    }}>
      <div className="flex min-h-screen bg-gray-50" dir="rtl">
        {/* Sidebar navigation */}
        <div
          id="sidebar"
          className={`fixed inset-y-0 right-0 bg-blue-700 text-white p-4 transform ${
            isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
          } transition-transform duration-300 lg:translate-x-0 lg:static lg:w-64 z-40 shadow-xl`}
        >
          <div className="flex items-center justify-between mb-6 border-b border-blue-600 pb-4">
            <h2 className="text-2xl font-bold">لوحة التحكم</h2>
            <button
              onClick={closeSidebar}
              className="lg:hidden text-white hover:bg-blue-600 p-1 rounded-full transition-colors"
              aria-label="إغلاق الشريط الجانبي"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-2 ">
              <UserCircle size={24} className="text-blue-300" />
              <span className="font-semibold">{userName || "مستخدم"}</span>
            </div>
            <p className="text-sm text-gray-300">
              الدور: {getRoleDisplayName(userRole)}
            </p>
          </div>
          
          <nav className="space-y-1">
            {userRole === ROLES.ADMIN && (
              <Link 
                to="/accounts" 
                onClick={closeSidebar}
                className={`block py-2 px-4 rounded transition duration-300 ${
                  location.pathname === '/accounts' 
                    ? 'bg-blue-800 font-medium' 
                    : 'hover:bg-blue-600'
                }`}
              >
                الحسابات
              </Link>
            )}
            {userRole && hasPermission('/students', userRole) && (
              <Link 
                to="/students" 
                onClick={closeSidebar}
                className={`block py-2 px-4 rounded transition duration-300 ${
                  location.pathname === '/students' 
                    ? 'bg-blue-800 font-medium' 
                    : 'hover:bg-blue-600'
                }`}
              >
                الطلاب
              </Link>
            )}
            {userRole && hasPermission('/announcements', userRole) && (
              <Link 
                to="/announcements" 
                onClick={closeSidebar}
                className={`block py-2 px-4 rounded transition duration-300 ${
                  location.pathname === '/announcements' 
                    ? 'bg-blue-800 font-medium' 
                    : 'hover:bg-blue-600'
                }`}
              >
                الإعلانات
              </Link>
            )}
            {userRole && hasPermission('/videos', userRole) && (
              <Link 
                to="/videos" 
                onClick={closeSidebar}
                className={`block py-2 px-4 rounded transition duration-300 ${
                  location.pathname === '/videos' 
                    ? 'bg-blue-800 font-medium' 
                    : 'hover:bg-blue-600'
                }`}
              >
                الفيديوهات
              </Link>
            )}
            {userRole && hasPermission('/seasons', userRole) && (
              <Link 
                to="/seasons" 
                onClick={closeSidebar}
                className={`block py-2 px-4 rounded transition duration-300 ${
                  location.pathname === '/seasons' || 
                  location.pathname.startsWith('/seasons/')
                    ? 'bg-blue-800 font-medium' 
                    : 'hover:bg-blue-600'
                }`}
              >
                الفصول الدراسية
              </Link>
            )}
          </nav>
          
          <div className="mt-auto pt-6 border-t border-blue-600 mt-8">
            <button 
              onClick={logout}
              className="w-full text-center py-2 px-4 rounded bg-red-700 bg-opacity-20 hover:bg-opacity-40 transition duration-300 text-white font-medium"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>

        {/* Hamburger menu button */}
        <button
          id="menu-button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed top-4 left-4 z-50 bg-blue-700 text-white p-2 rounded-lg lg:hidden hover:bg-blue-800 transition-colors duration-300 shadow-md"
          aria-label={isSidebarOpen ? "إغلاق القائمة" : "فتح القائمة"}
        >
          <Menu size={24} />
        </button>

        {/* Main content area */}
        <div className="flex-1 overflow-y-auto">
          <ErrorMessage message={error} />
          {children}
        </div>
      </div>
    </AuthContext.Provider>
  );
};


// SignIn component
const SignIn: React.FC = () => {
  const [credentials, setCredentials] = useState<Credentials>({
    phone_number: '',
    password: ''
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const [throttled, setThrottled] = useState<boolean>(false);

  useEffect(() => {
    // Clear user data on login page
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing again
    if (error) setError('');
  };

  const throttleSubmit = () => {
    if (throttled) return true;
    
    setThrottled(true);
    setTimeout(() => {
      setThrottled(false);
    }, 5000);
    
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (throttleSubmit()) return;
  
    setError('');
    setLoading(true);
  
    const phoneRegex = /^07\d{9}$/;
    const { phone_number, password } = credentials;
  
    if (!phoneRegex.test(phone_number)) {
      setError('الرجاء إدخال رقم هاتف صحيح مكون من 11 رقمًا يبدأ بـ 07');
      setLoading(false);
      return;
    }
  
    try {
      const response: UserResponse = await POST('api/sign-in', { phone_number, password });
  
      if (!response || !response.value) {
        const fallbackError = response?.limit_issue || 'رقم الهاتف أو كلمة المرور غير صحيحة';
        throw new Error(fallbackError);
      }
  
      localStorage.setItem('userId', String(response.value));
      if (response.token) localStorage.setItem('token', response.token);
  
      const userResponse: UserResponse = await POST("api/handle-account-fetching", { id: Number(response.value) });
      const user = userResponse?.data?.[0];
  
      if (!user?.role) throw new Error('MISSING_ROLE');
  
      let role = user.role.toLowerCase();
      if (role === 'student') role = 'announcer';
  
      localStorage.setItem('userRole', role);
      if (user.name) localStorage.setItem('userName', user.name);
  
      navigate(role === ROLES.ADMIN ? '/accounts' : '/announcements', { replace: true });
  
    } catch (err) {
      localStorage.removeItem('userId');
      localStorage.removeItem('token');
  
      let message = 'حدث خطأ غير متوقع';
  
      if (typeof err === 'object' && err !== null) {
        const msg = 'message' in err ? (err as Error).message : '';
  
        let extractedJson = '';
        try {
          const jsonMatch = msg.match(/\{.*\}/);
          if (jsonMatch) extractedJson = jsonMatch[0];
        } catch {
          console.log("Error extracting JSON part from the message.");
        }
  
        try {
          const parsed = extractedJson ? JSON.parse(extractedJson) : {};
          console.log(parsed);
  
          if (parsed.password_issue) {
            message = `كلمة المرور غير صحيحة. المحاولات المتبقية: ${parsed.leftAttempts}`;
          }
        } catch {
          console.log("Failed to parse the JSON part.");
        }
  
        if (msg.includes('limit_issue_five_hours')) {
          message = 'يجب أن تنتظر لمدة 5 ساعات قبل أن تحاول مرة أخرى';
        } else if (msg.includes('limit_issue_one_hour')) {
          message = 'يجب أن تنتظر لمدة ساعة قبل أن تحاول مرة أخرى';
        } else if (msg.includes('limit_issue')) {
          message = 'لقد تم قفل حسابك، الرجاء التواصل مع الدعم الفني';
        } else if (msg === 'MISSING_ROLE') {
          message = 'فشل في جلب معلومات المستخدم';
        } else if (!extractedJson && msg) {
          message = `حدث خطأ داخلي: ${msg}`;
        }
      }
  
      setError(message);
    } finally {
      setLoading(false);
    }
  };
  
  
  
  

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex items-center justify-center px-4" dir="rtl">
      <div className="max-w-md w-full bg-white shadow-2xl rounded-2xl p-8 space-y-6 animate-fadeIn">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-blue-800">
            تسجيل الدخول
          </h2>
          <p className="text-gray-600 mt-2">أدخل بيانات حسابك للمتابعة</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
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
              className="w-full px-4 py-3 border border-blue-300 rounded-lg 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              transition duration-300 ease-in-out"
              placeholder="أدخل رقم الهاتف (يبدأ بـ 07)"
              autoComplete="tel"
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
              className="w-full px-4 py-3 border border-blue-300 rounded-lg 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              transition duration-300 ease-in-out"
              placeholder="أدخل كلمة المرور"
              autoComplete="current-password"
            />
          </div>
          
          <ErrorMessage message={error} />
          
          <button
            type="submit"
            disabled={loading || throttled}
            className={`w-full py-3 text-white rounded-lg 
            transition duration-300 ease-in-out 
            font-bold uppercase tracking-wider shadow-md
            ${loading || throttled
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 hover:shadow-lg'
            }`}
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Protected Route component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = [] 
}) => {
  const isAuthenticated = !!localStorage.getItem('userId');
  const isTokenExist = !!localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user has the required role
    if (isAuthenticated && isTokenExist && requiredRoles.length > 0 && userRole && !requiredRoles.includes(userRole)) {
      navigate('/announcements', { replace: true });
    }
  }, [navigate, requiredRoles, userRole, isAuthenticated, isTokenExist]);
  
  if (!isAuthenticated || !isTokenExist) {
    return <Navigate to="/" replace />;
  }
  
  return <Layout>{children}</Layout>;
};

// Router configuration
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
      <ProtectedRoute requiredRoles={[ROLES.ADMIN, ROLES.TEACHER, ROLES.ANNOUNCER]}>
        <ANNOUNCEMENTS />
      </ProtectedRoute>
    ),
  },
  {
    path: '/videos',
    element: (
      <ProtectedRoute requiredRoles={[ROLES.ADMIN]}>
        <VIDEOS />
      </ProtectedRoute>
    ),
  },
  {
    path: '/seasons',
    element: (
      <ProtectedRoute requiredRoles={[ROLES.ADMIN, ROLES.TEACHER]}>
        <SEASONS />
      </ProtectedRoute>
    ),
  },
  {
    path: '/seasons/lecture',
    element: (
      <ProtectedRoute requiredRoles={[ROLES.ADMIN, ROLES.TEACHER]}>
        <LECTURE />
      </ProtectedRoute>
    ),
  },
  {
    path: '/seasons/lecture/specified',
    element: (
      <ProtectedRoute requiredRoles={[ROLES.ADMIN, ROLES.TEACHER]}>
        <SPECIFIEDLECTURE />
      </ProtectedRoute>
    ),
  },
  // Catch all route
  {
    path: '*',
    element: <Navigate to="/announcements" replace />
  }
]);

// Add these animation classes to your CSS file
/* Add to index.css:
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-in-out;
}
*/

function App() {
  return <RouterProvider router={router} />;
}

export default App;