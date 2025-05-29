import { Tabs } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Image, Platform, StyleSheet, Text } from 'react-native';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Colors } from '@/constants/Colors';
import SignIn from '@/components/auth/register/signIn-main'; // You'll need to create this component

const homeIcon = require("@/assets/images/icons/home.png");
const lecturesIcon = require("@/assets/images/icons/lectures.png");
const accountIcon = require("@/assets/images/icons/account.png");

interface TabIconProps {
  icon: any;
  focused: boolean;
}

const icons = {
  home: homeIcon,
  lectures: lecturesIcon,
  account: accountIcon,
};

const TabIcon = ({ icon, focused }: TabIconProps) => (
  <Image
    source={icon}
    style={[styles.icon, { tintColor: focused ? Colors.light.tint : '#888' }]}
    resizeMode="contain"
  />
);

export default function TabLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const [fontsLoaded] = useFonts({
    Alexandria: require('../../assets/fonts/Alexandria-Regular.ttf'),
  });

  // Check if user is authenticated on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        setIsAuthenticated(!!token);
      } catch (error) {
        console.error('Error checking authentication status:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Handle successful login
  const handleLoginSuccess = async (token: string) => {
    try {
      await AsyncStorage.setItem("userToken", token);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error saving auth token:', error);
    }
  };

  // Show loading indicator while fonts are loading or checking auth status
  if (!fontsLoaded || isAuthenticated === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  // Show sign-in screen if not authenticated
  if (!isAuthenticated) {
    return <SignIn onLoginSuccess={handleLoginSuccess} />;
  }

  // Show tab layout if authenticated
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.light.tint,
        tabBarInactiveTintColor: '#888',
        tabBarLabelStyle: {
          fontFamily: 'Alexandria',
          fontSize: 12,
          margin: 2,
          
        
        },
        tabBarStyle: {
          position: Platform.OS === 'ios' ? 'absolute' : 'relative',
          borderTopWidth: 1,
          elevation: 0,
          backgroundColor: 'transparent',
          
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'الرئيسية',
          tabBarIcon: ({ focused }) => <TabIcon icon={icons.home} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="lectures"
        options={{
          title: 'المحاضرات',
          tabBarIcon: ({ focused }) => <TabIcon icon={icons.lectures} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'حسابي',
          tabBarIcon: ({ focused }) => <TabIcon icon={icons.account} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 26,
    height: 26,
  },
});