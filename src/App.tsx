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
import { Menu, X } from 'lucide-react'; // Import icons for the burger menu

// Define user roles and their permissions
const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  ANNOUNCER: 'announcer'
};

// Define access permissions for each route
const ROUTE_PERMISSIONS = {
  '/accounts': [ROLES.ADMIN],
  '/students': [ROLES.ADMIN, ROLES.TEACHER],
  '/students/student': [ROLES.ADMIN, ROLES.TEACHER],
  '/announcements': [ROLES.ADMIN, ROLES.TEACHER, ROLES.ANNOUNCER]
};

// Navigation Layout Component
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for burger menu

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
          setError("You don't have permission to access this page");
        }
      } else {
        setError("Unable to fetch user role");
      }
    } catch (error) {
      console.error("Error fetching account:", error);
      setError("Failed to verify your account");
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
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Navigation */}
      <div
        className={`fixed inset-y-0 left-0 bg-gray-800 text-white p-4 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 lg:translate-x-0 lg:static lg:w-64`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-white"
            aria-label="Close sidebar"
          >
            <X size={24} />
          </button>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Role: {userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'Unknown'}
        </p>
        <nav className="space-y-4">
          {userRole === ROLES.ADMIN && (
            <Link 
              to="/accounts" 
              className="block py-2 px-4 rounded hover:bg-gray-700 transition duration-300"
            >
              Accounts
            </Link>
          )}
          {userRole && hasPermission('/students', userRole) && (
            <Link 
              to="/students" 
              className="block py-2 px-4 rounded hover:bg-gray-700 transition duration-300"
            >
              Students
            </Link>
          )}
          {userRole && hasPermission('/announcements', userRole) && (
            <Link 
              to="/announcements" 
              className="block py-2 px-4 rounded hover:bg-gray-700 transition duration-300"
            >
              Announcements
            </Link>
          )}
          <button 
            onClick={handleLogout}
            className="w-full text-left py-2 px-4 rounded hover:bg-red-700 transition duration-300 text-red-300 hover:text-white"
          >
            Logout
          </button>
        </nav>
      </div>

      {/* Burger Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 right-4 z-50 bg-gray-800 text-white p-2 rounded-lg lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu size={24} />
      </button>

      {/* Main Content Area */}
      <div className="flex-1 bg-gray-100 p-6 overflow-y-auto">
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

// Sign In Component
const SignIn = () => {
  const [credentials, setCredentials] = useState({
    phone_number: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any stored user data on the sign-in page
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

    // Phone number validation
    const phoneRegex = /^[0-9]{11}$/;
    if (!phoneRegex.test(credentials.phone_number)) {
      setError('Please enter a valid 11-digit phone number');
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
        
        // Get user role immediately after login to determine where to navigate
        try {
          const userResponse = await POST("api/handle-account-fetching", {
            id: Number(response.value)
          });
          
          if (userResponse?.data?.[0]?.role) {
            // Map 'student' to 'announcer' if it comes from the backend
            let role = userResponse.data[0].role.toLowerCase();
            if (role === 'student') {
              role = 'announcer';
            }
            
            localStorage.setItem('userRole', role);
            
            // Navigate based on role
            if (role === ROLES.ADMIN) {
              navigate('/accounts'); // Admins go to accounts page
            } else {
              navigate('/announcements'); // Other roles go to announcements
            }
          } else {
            navigate('/announcements'); // Default if can't determine role
          }
        } catch (err) {
          console.error("Failed to fetch user role:", err);
          navigate('/announcements'); // Default if error
        }
      } else {
        setError('Invalid phone number or password');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white shadow-2xl rounded-2xl p-8 space-y-6">
        <h2 className="text-3xl font-bold text-center text-gray-800">
          Sign In
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone_number"
              value={credentials.phone_number}
              onChange={handleInputChange}
              required
              maxLength={11}
              pattern="[0-9]{11}"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg 
              focus:outline-none focus:ring-2 focus:ring-blue-500 
              transition duration-300 ease-in-out"
              placeholder="Enter 11-digit phone number"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              required
              minLength={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg 
              focus:outline-none focus:ring-2 focus:ring-blue-500 
              transition duration-300 ease-in-out"
              placeholder="Enter your password"
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
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Role-Based Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode, requiredRoles?: string[] }> = ({ 
  children, 
  requiredRoles = [] 
}) => {
  const isAuthenticated = !!localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');
  const navigate = useNavigate();
  
  useEffect(() => {
    // If route has required roles and user doesn't have permission
    if (requiredRoles.length > 0 && userRole && !requiredRoles.includes(userRole)) {
      navigate('/announcements');
    }
  }, [navigate, requiredRoles, userRole]);
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <Layout>{children}</Layout>;
};

// Router Configuration
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
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;