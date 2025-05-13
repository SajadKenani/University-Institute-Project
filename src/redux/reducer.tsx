import {
    SET_SHOW_ADD_FORM, SET_SHOW_CSV_UPLOAD_FORM, SET_SHOW_ADD_CASSFORM,
    SET_ACTIVE_TAB, SET_STUDENTS, SET_STUDENTS_TO_CLASSES,
    SET_COUNTER, SET_SEARCH_TERM, SET_SELECTED_CLASS,
    SET_CLASSES, SET_SCV_FORM, SET_CLASS_SEARCH_TERM, SET_CLASS_NAME
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
  students: [],
  selectedClass: "",
  studentsToClasses: "",
  counter: 0,
  searchTerm: "",
  classes: [],
  SCVForm: null,
  classSearchTerm: "",
  className: ""
};

const reducer = (state = initialState, action: any) => {
  const { type, payload } = action;

  switch (type) {
    case SET_SHOW_ADD_FORM: return { ...state, showAddForm: payload };
    case SET_SHOW_CSV_UPLOAD_FORM: return { ...state, showCSVUploadForm: payload };
    case SET_SHOW_ADD_CASSFORM: return { ...state, showAddClassForm: payload };
    case SET_ACTIVE_TAB: return { ...state, activeTab: payload };
    case SET_STUDENTS: return { ...state, students: payload };
    case SET_STUDENTS_TO_CLASSES: return { ...state, studentsToClasses: payload };
    case SET_COUNTER: return { ...state, counter: payload };
    case SET_SEARCH_TERM: return { ...state, searchTerm: payload };
    case SET_SELECTED_CLASS: return { ...state, selectedClass: payload };
    case SET_CLASSES: return { ...state, classes: payload };
    case SET_SCV_FORM: return { ...state, SCVForm: payload };
    case SET_CLASS_SEARCH_TERM: return { ...state, classSearchTerm: payload };
    case SET_CLASS_NAME: return { ...state, className: payload };
    default: return state;
  }
};

export default reducer;