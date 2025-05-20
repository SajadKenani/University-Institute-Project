import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setClasses as setClassesAction,
  setStudents,
  setShowAddClassForm,
  setShowCSVUploadForm,
  setShowAddForm
} from "../redux/actions";
import { DELETE, GET, getToken, POST, PUT } from "./Requests";
import { HandleLogin } from "./Auth";

interface RootState {
  reducer: {
    counter: number;
    selectedClass: string;
    SCVForm: FormData;
    className: string;
    newStudent: any
  };
}

const useFetchHandlers = ({
  setLoadingClasses,
  setLoadingStudents,
  setClassName,
  newStudent,
}: any) => {
  const dispatch = useDispatch();
  const {
    counter,
    selectedClass,
    SCVForm,
    className,

  } = useSelector((state: RootState) => state.reducer);

  const HandleClassesFetching = useCallback(async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    setLoadingClasses(true);
    try {
      const response = await GET(`api/fetch-classes/${Number(userId)}`);
      if (response.data && Array.isArray(response.data)) {
        dispatch(setClassesAction(response.data));
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    } finally {
      setLoadingClasses(false);
    }
  }, [dispatch, setLoadingClasses]);

  const HandleStudentsFetching = useCallback(async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    setLoadingStudents(true);
    try {
      const response = await GET(`api/fetch-student-accounts/${Number(userId)}`);
      if (response.data && Array.isArray(response.data)) {
        console.log(response.data)
        dispatch(setStudents(response.data));
      }
    } catch (error) {
      console.error("Failed to fetch students:", error);
    } finally {
      setLoadingStudents(false);
    }
  }, [dispatch, setLoadingStudents]);

  const HandleStudentDeletion = useCallback(
    async (studentId: number) => {
      setLoadingStudents(true);
      try {
        await DELETE(`api/delete-student/${studentId}`);
        await HandleStudentsFetching();
      } catch (error) {
        console.error("Failed to delete student:", error);
      } finally {
        setLoadingStudents(false);
      }
    },
    [HandleStudentsFetching, setLoadingStudents]
  );

  const HandleSettingStudentsToClasses = useCallback(async () => {
    try {
      await POST(`api/set-students-to-classes/${counter}`, {});
      await HandleClassesFetching();
      await HandleStudentsFetching();
    } catch (error) {
      console.error("Failed to assign students to classes:", error);
    }
  }, [counter, HandleClassesFetching, HandleStudentsFetching]);

  const HandleClassAdjustment = useCallback(
    async (studentId: number) => {
      try {
        await PUT(`api/update-class/${studentId}/${selectedClass}`, {});
        await HandleStudentsFetching();
        await HandleClassesFetching();
      } catch (error) {
        console.error("Failed to adjust class:", error);
      }
    },
    [selectedClass, HandleStudentsFetching, HandleClassesFetching]
  );

  const HandleCSVSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();

    let authToken = await getToken();
    if (!authToken) {
      try {
        await HandleLogin();
        authToken = await getToken();
        if (!authToken) throw new Error("Token not retrieved after login.");
      } catch (error) {
        console.error("Login failed:", error);
        return;
      }
    }

    const authorID = localStorage.getItem("userId");
    if (!authorID) return;

    try {
      const res = await fetch(`http://localhost:8081/api/insert-via-csv/${authorID}`, {
        method: "POST",
        body: SCVForm,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Upload failed with status: ${res.status}`);
      }
    } catch (error) {
      console.error("CSV upload error:", error);
    } finally {
      await HandleClassesFetching();
      await HandleStudentsFetching();
      dispatch(setShowCSVUploadForm(false));
    }
  }, [SCVForm, dispatch, HandleClassesFetching, HandleStudentsFetching]);

  const HandleClassDeletion = useCallback(async (classId: number) => {
     setLoadingClasses(true);
    try {
      await DELETE(`api/delete-class/${classId}`);
    } catch (error) {
      console.error("Failed to delete class:", error);
    } finally {
      HandleClassesFetching();
    }
  }, [HandleClassesFetching]);

  const HandleClassInsertion = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      dispatch(setShowAddClassForm(false))
      
      const userId = localStorage.getItem("userId");

      if (!userId || !className.trim()) {
        console.warn("Missing class name or user ID");
        return;
      }
       
      try {
        await POST("api/insert-class", {
          name: className.trim(),
          author_id: Number(userId),
        });

      } catch (error) {
        console.error("Error inserting class:", error);
      } finally {
        await HandleClassesFetching();
        }
    },
    [className, setClassName, dispatch]
  );

      const HandleStudentInsertion = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        const userId = localStorage.getItem('userId');
        console.log(newStudent)

        if (!userId) {
            return;
        }

        // Validation
        if (!newStudent.name.trim()) {
            return;
        }

        if (!newStudent.email.trim() || !newStudent.email.includes('@')) {
            return;
        }

        if (newStudent.password.length < 6) {
            return;
        }

        try {
            const response = await POST("api/create-student-account", {
                name: newStudent.name.trim(),
                email: newStudent.email.trim(),
                password: newStudent.password,
                author_id: Number(userId)
            });

            if (response) {

                // Hide the form after successful submission
                dispatch(setShowAddForm(false));
            } else {

            }
        } catch (error) {
            console.error(error);
        } finally {
            HandleStudentsFetching()
        }
    }, [newStudent]);

  return {
    HandleClassesFetching,
    HandleStudentsFetching,
    HandleStudentDeletion,
    HandleSettingStudentsToClasses,
    HandleClassAdjustment,
    HandleCSVSubmit,
    HandleClassDeletion,
    HandleClassInsertion,
    HandleStudentInsertion,
  };
};

export default useFetchHandlers;
