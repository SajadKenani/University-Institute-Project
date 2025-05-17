import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setClasses, setClassName, setShowAddClassForm, setShowCSVUploadForm, setStudents } from "../redux/actions";
import { DELETE, GET, getToken, POST, PUT } from "./Requests";
import { HandleLogin } from "./Auth";

const useFetchHandlers = ({setLoadingClasses, setLoadingStudents}: any) => {
    const dispatch = useDispatch();
    const counter = useSelector((state: any) => state.reducer.counter);
    const selectedClass = useSelector((state: any) => state.reducer.selectedClass);
    const SCVForm = useSelector((state: any) => state.reducer.SCVForm)
    const className = useSelector((state: any) => state.reducer.className)

    const HandleClassesFetching = useCallback(async () => {
        const userId = localStorage.getItem("userId");
        if (!userId) return;
        setLoadingClasses(true)

        try {
            const response = await GET(`api/fetch-classes/${Number(userId)}`);
            if (response.data && Array.isArray(response.data)) {
                dispatch(setClasses(response.data));
            }
        } catch (error) {
            console.error(error);
        } finally {setLoadingClasses(false)}
    }, [dispatch]);

    const HandleStudentsFetching = useCallback(async () => {
        const userId = localStorage.getItem("userId");
        if (!userId) return;
        setLoadingStudents(true)
      
        try {
            const response = await GET(`api/fetch-student-accounts/${Number(userId)}`);
            if (response.data && Array.isArray(response.data)) {
                dispatch(setStudents(response.data));
            }
        } catch (error) {
            console.error(error);
        } finally {setLoadingStudents(false)}
    }, [dispatch]);

    const HandleStudentDeletion = useCallback(
        async (studentId: any) => {
            setLoadingStudents(true)
            try {
                await DELETE(`api/delete-student/${studentId}`);
                await HandleStudentsFetching();
            } catch (error) {
                console.error(error);
                
            } finally {setLoadingStudents(false)}
        },
        [HandleStudentsFetching]
    );

    const HandleSettingStudentsToClasses = useCallback(async () => {
        try {
            await POST(`api/set-students-to-classes/${Number(counter)}`, {});
            await HandleClassesFetching();
            await HandleStudentsFetching();
        } catch (error) {
            console.error(error);
        }
    }, [counter, HandleClassesFetching, HandleStudentsFetching]);

    const HandleClassAdjustment = useCallback(
        async (studentId: any) => {
            try {
                await PUT(`api/update-class/${studentId}/${Number(selectedClass)}`, {});
                await HandleStudentsFetching();
                await HandleClassesFetching();
            } catch (error) {
                console.error(error);
            }
        },
        [selectedClass, HandleStudentsFetching, HandleClassesFetching]
    );

    const HandleCSVSubmit = async (event: any) => {
        event.preventDefault();
        let authToken = await getToken();
        if (!authToken) {
            try {
                await HandleLogin();
                authToken = await getToken();

                if (!authToken) {
                    throw new Error("Unable to retrieve token after login.");
                }
            } catch (error) {
                console.error("Login failed:", error);
                return;
            }
        }

        const authorID = localStorage.getItem('userId');
        if (!authorID) {
            return;
        }

        try {
            const res = await fetch(`http://localhost:8081/api/insert-via-csv/${authorID}`, {
                method: "POST",
                body: SCVForm,
                headers: {
                    Authorization: `Bearer ${authToken}`,
                }
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
        } catch (error) {
            console.error("CSV upload error:", error);
        } finally {
            HandleClassesFetching();
            HandleStudentsFetching();
            dispatch(setShowCSVUploadForm(false));
        }
    };

    const HandleClassDeletion = async (classId: number) => {
        try {
            await DELETE(`api/delete-class/${classId}`, {});
        } catch (error) { console.log(error); }
        finally {
            HandleClassesFetching();
        }
    };

      const HandleClassInsertion = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        const userId = localStorage.getItem('userId');
      
        if (!userId) {
          return;
        }
      
        // Validation
        if (!className.trim()) {
          // You can add a message for the user to know that the class name is required
          return;
        }
      
        try {
          const response = await POST("api/insert-class", {
            name: className.trim(),
            author_id: Number(userId),
          });
      
          if (response && response.data) {
            const newClass = { name: className.trim(), id: response.data.id ?? 0 };
      
            // Update local state with the new class
            setClasses((prev: any) => [...prev, newClass]);
      
            // Reset form
            dispatch(setClassName(""));
      
            // Hide the form after successful submission
            dispatch(setShowAddClassForm(false));
          }
        } catch (error) {
          console.error("Error inserting class:", error);
        } finally {
          // Fetch the updated list of classes
          HandleClassesFetching();
        }
      }, []);

      
    

    return {
        HandleClassesFetching,
        HandleStudentsFetching,
        HandleStudentDeletion,
        HandleSettingStudentsToClasses,
        HandleClassAdjustment,
        HandleCSVSubmit,
        HandleClassDeletion,
        HandleClassInsertion,
    };
};

export default useFetchHandlers;
