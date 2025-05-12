import {
    SET_SHOW_ADD_FORM,
    SET_SHOW_CSV_UPLOAD_FORM,
    SET_SHOW_ADD_CASSFORM,
    SET_ACTIVE_TAB,
    SET_STUDENTS,
    SET_STUDENTS_TO_CLASSES,
    SET_COUNTER,
    SET_SEARCH_TERM,
    SET_SELECTED_CLASS,
    SET_CLASSES
} from './actions';


export interface Student {
    id?: number;
    name: string;
    email: string;
    password: string;
    class: string;
}

const initialState = {
    showAddForm: false,
    showCSVUploadForm: false,
    showAddClassForm: false,
    activeTab: 'students' as 'students' | 'classes',
    students: [] as Student[],
    selectedClass: ""
};

const reducer = (state = initialState, action: any) => {
    switch (action.type) {
        case SET_SHOW_ADD_FORM:
            return {
                ...state,
                showAddForm: action.payload
            };
        case SET_SHOW_CSV_UPLOAD_FORM:
            return {
                ...state,
                showCSVUploadForm: action.payload
            };
        case SET_SHOW_ADD_CASSFORM:
            return {
                ...state,
                showAddClassForm: action.payload
            };
        case SET_ACTIVE_TAB:
            return {
                ...state,
                activeTab: action.payload
            };
        case SET_STUDENTS:
            return {
                ...state,
                students: action.payload
            };
        case SET_STUDENTS_TO_CLASSES:
            return {
                ...state,
                studentsToClasses: action.payload
            }
        case SET_COUNTER:
            return {
                ...state,
                counter: action.payload
            }
        case SET_SEARCH_TERM:
            return {
                ...state,
                searchTerm: action.payload
            }
        case SET_SELECTED_CLASS:
            return {
                ...state,
                selectedClass: action.payload
            }
            case SET_CLASSES:
                return {
                    ...state,
                    setClasses: action.payload
                }
        default:
            return state;
    }
}

export default reducer;