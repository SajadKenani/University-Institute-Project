export const SET_SHOW_ADD_FORM = 'SET_SHOW_ADD_FORM'
export const SET_SHOW_CSV_UPLOAD_FORM = 'SET_SHOW_CSV_UPLOAD_FORM'
export const SET_SHOW_ADD_CASSFORM = 'SET_SHOW_ADD_CASSFORM'
export const SET_ACTIVE_TAB = 'SET_ACTIVE_TAB'
export const SET_STUDENTS = 'SET_STUDENTS'
export const SET_STUDENTS_TO_CLASSES = 'SET_STUDENTS_TO_CLASSES'
export const SET_COUNTER = 'SET_COUNTER'
export const SET_SEARCH_TERM = 'SET_SEARCH_TERM'

interface Student {
    id?: number;
    name: string;
    email: string;
    password: string;
    class: string;
  }

export const setShowAddForm = (parameter: boolean) => ({
    type: SET_SHOW_ADD_FORM,
    payload: parameter,
});

export const setShowCSVUploadForm = (parameter: boolean) => ({
    type: SET_SHOW_CSV_UPLOAD_FORM,
    payload: parameter,
});

export const setShowAddClassForm = (parameter: boolean) => ({
    type: SET_SHOW_ADD_CASSFORM,
    payload: parameter,
});

export const setActiveTab = (parameter: 'students' | 'classes') => ({
    type: SET_ACTIVE_TAB,
    payload: parameter,
})

export const setStudents = (parameter: Student[]) => ({
    type: SET_STUDENTS,
    payload: parameter,
})

export const handleSettingStudentsToClasses = (parameter: any) => ({
    type: SET_STUDENTS_TO_CLASSES,
    payload: parameter,
})

export const setCounter = (parameter: number) => ({
    type: SET_COUNTER,
    payload: parameter,
})

export const setSearchTerm = (parameter: string) => ({
    type: SET_SEARCH_TERM,
    payload: parameter,
})