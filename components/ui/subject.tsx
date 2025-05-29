import React from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';

interface SubjectProps {
  item: {
    name?: string;
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

  // Subject icons
  const chemistry = require("../../assets/images/icons/chemistry.png");
  const math = require("../../assets/images/icons/math.png");
  const physics = require("../../assets/images/icons/physics.png");
  // Add these icons to your assets folder
  const biology = require("../../assets/images/icons/physics.png");
  const english = require("../../assets/images/icons/physics.png");
  const arabic = require("../../assets/images/icons/physics.png");
  const history = require("../../assets/images/icons/physics.png");
  const geography = require("../../assets/images/icons/physics.png");
  const art = require("../../assets/images/icons/physics.png");
  const music = require("../../assets/images/icons/physics.png");
  const sports = require("../../assets/images/icons/physics.png");
  const computer = require("../../assets/images/icons/physics.png");
  const defaultIcon = require('@/assets/images/icons/physics.png');

  const getIcon = () => {
    if (item.name === "رياضيات" || item.name === "الرياضيات") {
      return math;
    } else if (item.name === "كيمياء" || item.name === "الكيمياء") {
      return chemistry;
    } else if (item.name === "فيزياء" || item.name === "الفيزياء") {
      return physics;
    } else if (item.name === "أحياء" || item.name === "الأحياء" || item.name === "علوم الأحياء") {
      return biology;
    } else if (item.name === "إنجليزي" || item.name === "اللغة الإنجليزية" || item.name === "English") {
      return english;
    } else if (item.name === "عربي" || item.name === "اللغة العربية" || item.name === "العربية") {
      return arabic;
    } else if (item.name === "تاريخ" || item.name === "التاريخ") {
      return history;
    } else if (item.name === "جغرافيا" || item.name === "الجغرافيا" || item.name === "جغرافية") {
      return geography;
    } else if (item.name === "فن" || item.name === "الفنون" || item.name === "تربية فنية") {
      return art;
    } else if (item.name === "موسيقى" || item.name === "الموسيقى" || item.name === "تربية موسيقية") {
      return music;
    } else if (item.name === "رياضة" || item.name === "التربية البدنية" || item.name === "بدنية") {
      return sports;
    } else if (item.name === "حاسوب" || item.name === "الحاسوب" || item.name === "برمجة" || item.name === "تكنولوجيا") {
      return computer;
    } else {
      return defaultIcon;
    }
  };

  const getGradientColors = (): [string, string] => {
    if (item.name === "رياضيات" || item.name === "الرياضيات") {
      return ['rgba(151, 215, 41, 0.15)', 'rgb(177, 240, 68)']; // Light blue to medium blue
    } else if (item.name === "كيمياء" || item.name === "الكيمياء") {
      return ['rgba(211, 239, 251, 1)', 'rgba(23, 128, 255, 1)']; // Light purple to medium purple
    } else if (item.name === "فيزياء" || item.name === "الفيزياء") {
      return ['rgba(217, 234, 252, 1)', 'rgba(68, 94, 160, 1)']; // Light green to medium green
    } else if (item.name === "أحياء" || item.name === "الأحياء" || item.name === "علوم الأحياء") {
      return ['#E8F8F5', '#B2DFDB']; // Light mint to medium mint
    } else if (item.name === "إنجليزي" || item.name === "اللغة الإنجليزية" || item.name === "English") {
      return ['#FFF3E0', '#FFE0B2']; // Light orange to medium orange
    } else if (item.name === "عربي" || item.name === "اللغة العربية" || item.name === "العربية") {
      return ['#FFF8E1', '#FFF176']; // Light yellow to medium yellow
    } else if (item.name === "تاريخ" || item.name === "التاريخ") {
      return ['#F9F2FF', '#E1BEE7']; // Light lavender to medium lavender
    } else if (item.name === "جغرافيا" || item.name === "الجغرافيا" || item.name === "جغرافية") {
      return ['#E0F2F1', '#B2DFDB']; // Light teal to medium teal
    } else if (item.name === "فن" || item.name === "الفنون" || item.name === "تربية فنية") {
      return ['#FCE4EC', '#F8BBD9']; // Light pink to medium pink
    } else if (item.name === "موسيقى" || item.name === "الموسيقى" || item.name === "تربية موسيقية") {
      return ['#F1F8E9', '#DCEDC8']; // Light lime to medium lime
    } else if (item.name === "رياضة" || item.name === "التربية البدنية" || item.name === "بدنية") {
      return ['#FFEBEE', '#FFCDD2']; // Light red to medium red
    } else if (item.name === "حاسوب" || item.name === "الحاسوب" || item.name === "برمجة" || item.name === "تكنولوجيا") {
      return ['#E8EAF6', '#C5CAE9']; // Light indigo to medium indigo
    } else {
      return ['#F5F5F5', '#E0E0E0']; // Light gray to medium gray
    }
  };

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
      <LinearGradient
        colors={getGradientColors()}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.imageContainer}>
          <Image style={styles.image} source={getIcon()} />
        </View>
      </LinearGradient>
      <Text style={styles.title}>{item?.name}</Text>
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
    flex: 1,
    alignItems: 'center',
  },
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 100,
    width: '100%',
    maxWidth: 100,
    elevation: 2, // Add subtle shadow on Android
    shadowColor: '#000', // Add shadow on iOS
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
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