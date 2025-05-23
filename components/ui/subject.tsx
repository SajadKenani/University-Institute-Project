import React from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';

interface SubjectProps {
  item: {
    title?: string;
    content?: string;
    image?: string;
  };
}

export default function Subject({ item }: SubjectProps) {
  const [fontsLoaded] = useFonts({
    AlexandriaRegular: require('../../assets/fonts/Alexandria-Regular.ttf'),
    AlexandriaBold: require('../../assets/fonts/Alexandria-Bold.ttf'),
    AlexandriaSemiBold: require('../../assets/fonts/Alexandria-SemiBold.ttf'),
  });

  const icon = require('@/assets/images/icons/love.png');

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#0076DD" />
      </View>
    );
  }

  if (!item) return null;

  return (
    <View style={styles.outerContainer}>
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <Image style={styles.image} source={icon} />
        </View>
      </View>
      <Text style={styles.title}>الكيمياء</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerContainer: {
    flex: 1, // Take full width of parent container
    alignItems: 'center', // Center the content
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    height: 100,
    width: '100%', // Use percentage instead of fixed width
    maxWidth: 100, // But don't exceed 100px
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 60,
    height: 60,
  },
  title: {
    fontSize: 16,
    fontFamily: 'AlexandriaSemiBold',
    textAlign: 'center',
    color: '#333',
    marginTop: 8,
  },
});