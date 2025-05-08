import React, { useState, useCallback, useRef, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { POST } from "@/components/auth/Request";
import { StackNavigationProp } from "@react-navigation/stack";

// Define navigation type
type RootStackParamList = {
  Home: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function SignIn() {
  const navigation = useNavigation<NavigationProp>();
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    general: ''
  });
  const [loading, setLoading] = useState(false);
  const passwordInputRef = useRef<TextInput | null>(null);
  
  // Check for existing session on component mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        const token = await AsyncStorage.getItem('token');
        
        if (userId && token) {
          // Navigate to home if already logged in
          navigation.replace('Home');
        }
      } catch (error) {
        console.error("Session check error:", error);
      }
    };
    
    checkExistingSession();
  }, [navigation]);
  
  // Throttle mechanism to prevent multiple rapid submissions
  const lastSubmitTime = useRef(0);
  const throttleSubmit = useCallback(() => {
    const now = Date.now();
    if (now - lastSubmitTime.current < 1000) { // 1 second cooldown
      return true;
    }
    lastSubmitTime.current = now;
    return false;
  }, []);

  const handleInputChange = useCallback((field: any, value: any) => {
    // Clear related error when typing
    setErrors(prev => ({
      ...prev,
      [field]: '',
      general: ''
    }));
    
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const validateForm = () => {
    let isValid = true;
    const newErrors = { email: '', password: '', general: '' };
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!credentials.email) {
      newErrors.email = 'الرجاء إدخال البريد الإلكتروني';
      isValid = false;
    } else if (!emailRegex.test(credentials.email)) {
      newErrors.email = 'الرجاء إدخال عنوان بريد إلكتروني صحيح';
      isValid = false;
    }
    
    // Validate password
    if (!credentials.password) {
      newErrors.password = 'الرجاء إدخال كلمة المرور';
      isValid = false;
    } else if (credentials.password.length < 6) {
      newErrors.password = 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = useCallback(async () => {
    if (throttleSubmit()) return;
    
    // Clear previous errors
    setErrors({ email: '', password: '', general: '' });
    
    // Validate form
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const response = await POST('api/sign-in-student', { 
        email: credentials.email, 
        password: credentials.password 
      });
      
      if (!response || !response.value) {
        const fallbackError = response?.limit_issue || 'رقم الهاتف أو كلمة المرور غير صحيحة';
        setErrors(prev => ({ ...prev, general: fallbackError }));
        return;
      }
      
      // Store user data in AsyncStorage
      try {
        await AsyncStorage.setItem('userId', String(response.value));
        if (response.token) await AsyncStorage.setItem('token', response.token);
        
        // Navigate to home screen on successful login
        navigation.replace('Home');
      } catch (storageError) {
        console.error("AsyncStorage error:", storageError);
        setErrors(prev => ({ ...prev, general: 'فشل في حفظ بيانات الجلسة' }));
      }

    } catch (err) {
      // Clear session data on error
      try {
        await AsyncStorage.removeItem('userId');
        await AsyncStorage.removeItem('token');
      } catch (storageError) {
        console.error("AsyncStorage error:", storageError);
      }
      
      // Handle specific error messages
      if (err instanceof Error) {
        const msg = err.message;
        console.log(msg);

        if (msg.includes('limit_issue_one_hour')) {
          setErrors(prev => ({ ...prev, general: 'يجب أن تنتظر لمدة ساعة قبل أن تحاول مرة أخرى' }));
        } else if (msg.includes('limit_issue_five_hours')) {
          setErrors(prev => ({ ...prev, general: 'يجب أن تنتظر لمدة 5 ساعات قبل أن تحاول مرة أخرى' }));
        } else if (msg.includes('password_error')) {
          setErrors(prev => ({ ...prev, password: 'كلمة المرور غير صحيحة' }));
        } else if (msg === 'MISSING_ROLE') {
          setErrors(prev => ({ ...prev, general: 'فشل في جلب معلومات المستخدم' }));
        } else {
          setErrors(prev => ({ ...prev, general: 'حدث خطأ غير متوقع. حاول مجددًا.' }));
        }
      } else {
        console.error("Unknown error:", err);
        setErrors(prev => ({ ...prev, general: 'حدث خطأ غير متوقع' }));
      }
    } finally {
      setLoading(false);
    }
  }, [credentials, throttleSubmit, navigation, validateForm]);

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };
  
  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>تسجيل الدخول</Text>
          
          {errors.general ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errors.general}</Text>
            </View>
          ) : null}
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>البريد الإلكتروني</Text>
            <TextInput
              style={[styles.input, errors.email ? styles.inputError : null]}
              placeholder="أدخل البريد الإلكتروني"
              value={credentials.email}
              onChangeText={(text) => handleInputChange('email', text)}
              keyboardType="email-address"
              autoComplete="email"
              textAlign="right"
              returnKeyType="next"
              onSubmitEditing={() => {
                if (passwordInputRef.current) {
                  passwordInputRef.current.focus();
                }
              }}
              accessibilityLabel="البريد الإلكتروني"
            />
            {errors.email ? (
              <Text style={styles.fieldErrorText}>{errors.email}</Text>
            ) : null}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>كلمة المرور</Text>
            <TextInput
              ref={passwordInputRef}
              style={[styles.input, errors.password ? styles.inputError : null]}
              placeholder="أدخل كلمة المرور"
              value={credentials.password}
              onChangeText={(text) => handleInputChange('password', text)}
              secureTextEntry
              textAlign="right"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              accessibilityLabel="كلمة المرور"
            />
            {errors.password ? (
              <Text style={styles.fieldErrorText}>{errors.password}</Text>
            ) : null}
          </View>
          
          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={handleForgotPassword}
            accessibilityLabel="نسيت كلمة المرور؟"
          >
            <Text style={styles.forgotPasswordText}>نسيت كلمة المرور؟</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, loading ? styles.buttonDisabled : null]} 
            onPress={handleSubmit}
            disabled={loading}
            accessibilityLabel="زر تسجيل الدخول"
            accessibilityState={{ disabled: loading }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>تسجيل الدخول</Text>
            )}
          </TouchableOpacity>
          
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>ليس لديك حساب؟</Text>
            <TouchableOpacity 
              onPress={handleSignUp}
              accessibilityLabel="إنشاء حساب جديد"
            >
              <Text style={styles.signupLink}>إنشاء حساب جديد</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 450,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#333',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#dc3545',
    borderWidth: 1,
  },
  errorContainer: {
    backgroundColor: '#fee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffccd1',
  },
  errorText: {
    color: '#dc3545',
    textAlign: 'center',
    fontSize: 14,
  },
  fieldErrorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  button: {
    backgroundColor: '#0d6efd',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: '#84b0f8',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: '#0d6efd',
    fontSize: 14,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  signupText: {
    color: '#555',
  },
  signupLink: {
    color: '#0d6efd',
    fontWeight: '600',
  },
});