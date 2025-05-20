import { useFonts } from 'expo-font';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, StyleProp, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  /** Text displayed on button */
  title?: string;
  /** Function called when button is pressed */
  onPress?: () => void;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Whether to show loading indicator */
  loading?: boolean;
  /** Whether to show only text in blue (no background) */
  textOnly?: boolean;
  /** Additional style for the button container */
  style?: StyleProp<ViewStyle>;
  /** Additional style for the button text */
  textStyle?: StyleProp<TextStyle>;
  /** Width of the button (number for exact pixels or string for percentage) */
  width?: number | string;
}

/**
 * Enhanced button component for React Native with various states:
 * - Default (solid blue)
 * - Text-only (blue text on transparent background)
 * - Disabled
 * - Loading
 */
export default function Button({
  title = "Button",
  onPress = () => {},
  disabled = false,
  loading = false,
  textOnly = false,
  style = {},
  textStyle = {},
  width = "100%",
}: ButtonProps) {
  const [isPressed, setIsPressed] = useState<boolean>(false);

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
      <TouchableOpacity
        activeOpacity={textOnly ? 0.5 : 0.7}
        onPress={disabled || loading ? undefined : onPress}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        disabled={disabled || loading}
        style={{
          width: width,
        }}
      >
        <View style={[
          styles.container,
          textOnly && styles.textOnly,
          isPressed && (textOnly ? styles.textOnlyPressed : styles.pressed),
          disabled && (textOnly ? styles.textOnlyDisabled : styles.disabled),
          style as ViewStyle
        ]}>
          {loading ? (
            <ActivityIndicator size="small" color={textOnly ? "#0076DD" : "#FFFFFF"} />
          ) : (
            <Text style={[
              styles.text,
              textOnly && styles.textOnlyText,
              disabled && (textOnly ? styles.textOnlyDisabledText : styles.disabledText),
              textStyle as TextStyle
            ]}>
              {title}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%", 
    display: "flex", 
    justifyContent: "center", 
    alignItems: "center"
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  touchable: {
    alignSelf: 'center',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#0076DD', // Primary blue color
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 14,
    color: '#FFFFFF', // White text
    fontFamily: "AlexandriaRegular",
    textAlign: 'center',
  },
  // Text-only style
  textOnly: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
  },
  textOnlyText: {
    color: '#0076DD', // Blue text
  },
  textOnlyPressed: {
    backgroundColor: 'rgba(0, 118, 221, 0.08)', // Very light blue background when pressed
  },
  textOnlyDisabled: {
    backgroundColor: 'transparent',
  },
  textOnlyDisabledText: {
    color: '#0076DD', // Faded blue for disabled text-only
  },
  // Standard button states
  pressed: {
    backgroundColor: '#005CA9', // Slightly darker blue when pressed
  },
  disabled: {
    backgroundColor: '#0076DD',
    opacity: 0.3,
  },
  disabledText: {
    color: '#FFFFFF',
  },
});