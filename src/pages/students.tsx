import React, { useCallback, useEffect, useState } from "react";
import { GET, POST } from "../components/Requests";
import { useNavigate } from "react-router-dom";
import { Users, UserPlus, Mail, Lock, User, Search, AlertCircle, Plus, X } from "lucide-react";

interface Student {
    id?: number;
    name: string;
    email: string;
    password: string;
}

export const STUDENTS = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [newStudent, setNewStudent] = useState<Student>({
        name: "",
        email: "",
        password: ""
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);
    const [loading, setLoading] = useState({
        fetching: false,
        inserting: false
    });
    const [error, setError] = useState<string | null>(null);
    const navigation = useNavigate();

    const handleStudentsFetching = useCallback(async () => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            setError("User not authenticated");
            return;
        }

        setLoading(prev => ({ ...prev, fetching: true }));
        setError(null);

        try {
            const response = await GET(`api/fetch-student-accounts/${Number(userId)}`);

            if (response.data && Array.isArray(response.data)) {
                setStudents(response.data);
            } else {
                setError("Invalid response format");
            }
        } catch (error) {
            console.error(error);
            setError("Failed to fetch students");
        } finally {
            setLoading(prev => ({ ...prev, fetching: false }));
        }
    }, []);

    const handleStudentInsertion = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        const userId = localStorage.getItem('userId');
        
        // Validation
        if (!newStudent.name.trim()) {
            setError("Name is required");
            return;
        }
        
        if (!newStudent.email.trim() || !newStudent.email.includes('@')) {
            setError("Valid email is required");
            return;
        }
        
        if (newStudent.password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(prev => ({ ...prev, inserting: true }));
        setError(null);

        try {
            const response = await POST("api/create-student-account", {
                name: newStudent.name.trim(),
                email: newStudent.email.trim(),
                password: newStudent.password,
                author_id: Number(userId)
            });

            if (response) {
                // Update local state
                setStudents(prev => [...prev, { ...newStudent, id: response.id }]);
                
                // Reset form
                setNewStudent({
                    name: "",
                    email: "",
                    password: ""
                });
                
                // Hide the form after successful submission
                setShowAddForm(false);
            } else {
                setError("Failed to create student account");
            }
        } catch (error) {
            console.error(error);
            setError("An error occurred while creating the account");
        } finally {
            setLoading(prev => ({ ...prev, inserting: false }));
        }
    }, [newStudent]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewStudent(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const filteredStudents = students.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        handleStudentsFetching();
    }, [handleStudentsFetching]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header with Add Button */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <Users className="text-indigo-600 mr-3" size={24} />
                        <h1 className="text-2xl font-bold text-indigo-900">Student Management</h1>
                    </div>
                    <button 
                        onClick={() => setShowAddForm(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center px-4 py-2 rounded-full shadow-md transition-all transform hover:scale-105"
                    >
                        <Plus size={20} className="m-1" />
                    </button>
                </div>
                
                {/* Main Content Area */}
                <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                    {/* Search and Count Bar */}
                    <div className="bg-indigo-600 p-4 flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center space-x-2 text-white mb-3 md:mb-0">
                            <Users size={20} />
                            <h2 className="text-xl font-semibold">Students</h2>
                            <span className="bg-white text-indigo-600 px-3 py-1 rounded-full text-sm font-medium">
                                {students.length}
                            </span>
                        </div>
                        <div className=" w-full md:w-72">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none 
                                focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                placeholder="Search students..."
                            />
                        </div>
                    </div>
                    
                    {/* Student List */}
                    {loading.fetching ? (
                        <div className="flex items-center justify-center p-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
                            <span className="ml-3 text-gray-600">Loading students...</span>
                        </div>
                    ) : students.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-16 text-center">
                            <Users className="text-gray-400 mb-4" size={64} />
                            <p className="text-gray-600 text-xl font-medium mb-2">No students found</p>
                            <p className="text-gray-500 mb-6">Get started by adding your first student</p>
                            <button 
                                onClick={() => setShowAddForm(true)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center px-4 py-2 rounded-lg"
                            >
                                <Plus size={20} className="mr-2" />
                                <span>Add Student</span>
                            </button>
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <Search className="text-gray-400 mb-4" size={48} />
                            <p className="text-gray-500 text-lg">No matching students</p>
                            <p className="text-gray-400 text-sm mt-2">Try a different search term</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-indigo-900">
                                        <th className="p-4 text-left font-medium">Name</th>
                                        <th className="p-4 text-left font-medium">Email</th>
                                        <th className="p-4 text-left font-medium"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map((student) => (
                                        <tr 
                                            key={student.id} 
                                            className="border-b hover:bg-indigo-50 transition-colors duration-150"
                                        >
                                            <td className="p-4 font-medium text-gray-800">{student.name}</td>
                                            <td className="p-4 text-gray-600">{student.email}</td>
                                            <td className="p-4 text-right">
                                                <button 
                                                    className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                                    onClick={() => {
                                                        localStorage.setItem("studentID", String(student.id));
                                                        navigation("student");
                                                    }}
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Add Student Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                        <div className="bg-indigo-600 p-4 flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                                <UserPlus className="text-white" size={20} />
                                <h2 className="text-xl font-semibold text-white">Add New Student</h2>
                            </div>
                            <button 
                                onClick={() => setShowAddForm(false)}
                                className="text-white hover:bg-indigo-700 rounded-full p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleStudentInsertion} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Student Name
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="name"
                                        value={newStudent.name}
                                        onChange={handleInputChange}
                                        className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Full name"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        value={newStudent.email}
                                        onChange={handleInputChange}
                                        className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="student@example.com"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        name="password"
                                        value={newStudent.password}
                                        onChange={handleInputChange}
                                        className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Min 6 characters"
                                    />
                                </div>
                            </div>
                            
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                                    <span className="text-red-700 text-sm">{error}</span>
                                </div>
                            )}
                            
                            <div className="flex items-center justify-end space-x-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading.inserting}
                                    className={`px-4 py-2 rounded-lg text-white font-medium transition-all flex items-center justify-center space-x-2
                                    ${loading.inserting 
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
                                    }`}
                                >
                                    <UserPlus size={18} />
                                    <span>{loading.inserting ? 'Creating...' : 'Add Student'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};