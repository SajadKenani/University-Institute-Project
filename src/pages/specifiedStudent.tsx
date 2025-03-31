import React, { useState, useCallback, useEffect } from "react";
import { TrashIcon } from "lucide-react";
import { toast } from "sonner";
import { DELETE, POST } from "../components/Requests";

interface Subject {
  id: number;
  name: string;
  degree: number;
}

export const SPECIFIEDSTUDENT: React.FC = () => {
  // State for form inputs
  const [name, setName] = useState<string>("");
  const [degree, setDegree] = useState<string>("0");

  // State for fetched subjects and loading
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Helper to get IDs from localStorage
  const getLocalStorageId = (key: string): number | null => {
    const value = localStorage.getItem(key);
    return value ? Number(value) : null;
  };

  // Fetch student subjects
  const handleStudentFetching = useCallback(async () => {
    try {
      setIsLoading(true);
      const studentId = getLocalStorageId("studentID");
      if (!studentId) {
        toast.error("No student ID found");
        return;
      }

      const response = await POST("api/fetch-subjects", { id: studentId });

      if (response?.data) {
        setSubjects(response.data);
      } else {
        toast.warning("No subjects found for this student");
      }
    } catch (error) {
      toast.error("Failed to fetch subjects", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Insert new subject
  const handleSubjectInsertion = useCallback(async () => {
    try {
      setIsSubmitting(true);

      // Validate inputs
      if (!name.trim() || Number(degree) <= 0) {
        toast.warning("Please enter a valid subject name and degree");
        return;
      }

      const userId = getLocalStorageId("userId");
      const studentId = getLocalStorageId("studentID");

      if (!userId || !studentId) {
        toast.error("User or student ID is missing");
        return;
      }

      const response = await POST("api/insert-subject", {
        author_id: userId,
        student_id: studentId,
        name: name.trim(),
        degree: Number(degree),
      });

      if (response) {
        setName("");
        setDegree("0");
        toast.success("Subject added successfully");
        handleStudentFetching();
      }
    } catch (error) {
      toast.error("Failed to insert subject", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [name, degree, handleStudentFetching]);

  // Delete subject
  const handleSubjectDeletion = useCallback(
    async (id: number) => {
      try {
        await DELETE(`api/delete-subject/${id}`, {});
        toast.success("Subject removed successfully");
        handleStudentFetching();
      } catch (error) {
        toast.error("Failed to delete subject", {
          description: error instanceof Error ? error.message : "Please try again.",
        });
      }
    },
    [handleStudentFetching]
  );

  // Fetch subjects on component mount
  useEffect(() => {
    handleStudentFetching();
  }, [handleStudentFetching]);

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Manage Subjects</h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700">
            Subject Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter subject name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="degree" className="block mb-2 text-sm font-medium text-gray-700">
            Degree
          </label>
          <input
            id="degree"
            type="number"
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
            placeholder="Enter degree"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          onClick={handleSubjectInsertion}
          disabled={isSubmitting}
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Adding..." : "Add Subject"}
        </button>
      </div>

      {isLoading ? (
        <p className="mt-8 text-center text-gray-500">Loading subjects...</p>
      ) : subjects.length > 0 ? (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Current Subjects</h3>
          <div className="bg-gray-50 rounded-md divide-y divide-gray-200">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className="flex items-center justify-between p-4 hover:bg-gray-100 transition-colors"
              >
                <div className="flex-grow">
                  <span className="font-medium text-gray-800">{subject.name}</span>
                  <span className="ml-4 text-sm text-gray-600">Degree: {subject.degree}</span>
                </div>
                <button
                  onClick={() => handleSubjectDeletion(subject.id)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                  aria-label="Remove subject"
                >
                  <TrashIcon size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-8 text-center text-gray-500">No subjects found.</p>
      )}
    </div>
  );
};