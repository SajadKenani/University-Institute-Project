import React from 'react';
import { TextInput, View, StyleSheet, TextInputProps, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';

interface InputProps extends TextInputProps {
  underlineColor?: string;
  underlineWidth?: number;
  label?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({
  underlineColor = '#3C3C435C',
  underlineWidth = 1,
  style,
  placeholder,
  label,
  error,
  ...props
}) => {
  // Move the font loading hook inside the component
  const [fontsLoaded] = useFonts({
    AlexandriaRegular: require('../../assets/fonts/Alexandria-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#0076DD" />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View 
        style={[
          styles.container, 
          { borderBottomColor: error ? 'gray' : underlineColor, 
            borderBottomWidth: underlineWidth 
          }
        ]}
      >
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor="#888"
          placeholder={placeholder}
          accessibilityLabel={label || placeholder}
          {...props}
          
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginVertical: 8,
  },
  container: {
    width: '100%',
    // Border styling moved to component props
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    width: '100%',
  },
  input: {
    paddingVertical: 8,
    paddingHorizontal: 0,
    fontSize: 14,
    fontFamily: "AlexandriaRegular",
    color: 'black',
    textAlign: "right",
    marginRight: 10,
    marginLeft: 10
  },
  label: {
    fontFamily: "AlexandriaRegular",
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  errorText: {
    fontFamily: "AlexandriaRegular",
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  }
});

export default Input;