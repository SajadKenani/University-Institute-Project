import { Tabs } from 'expo-router';
import React from 'react';
import { Image, Platform, StyleSheet, Text } from 'react-native';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';

import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';

import homeIcon from '@/assets/images/icons/home.png';
import lecturesIcon from '@/assets/images/icons/lectures.png';
import accountIcon from '@/assets/images/icons/account.png';

const icons = {
  home: homeIcon,
  lectures: lecturesIcon,
  account: accountIcon,
};

const TabIcon = ({ icon, focused }: { icon: any; focused: boolean }) => (
  <Image
    source={icon}
    style={[styles.icon, { tintColor: focused ? Colors.light.tint : '#888' }]}
    resizeMode="contain"
  />
);

export default function TabLayout() {
  const [fontsLoaded] = useFonts({
    Alexandria: require('../../assets/fonts/Alexandria-Thin.ttf'),
  });

  if (!fontsLoaded)
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.light.tint,
        tabBarInactiveTintColor: '#888',
        tabBarLabelStyle: {
          fontFamily: 'Alexandria',
          fontSize: 10,
        },
        tabBarStyle: {
          position: Platform.OS === 'ios' ? 'absolute' : 'relative',
          borderTopWidth: 0,
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
  icon: {
    width: 24,
    height: 24,
  },
});
