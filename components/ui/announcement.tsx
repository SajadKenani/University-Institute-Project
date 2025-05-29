import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useFonts } from 'expo-font';
import useFetchHandlers from '../auth/APIs';

// Local images
const announcementImg = require('@/assets/images/announcement.png');
const loveIcon = require('@/assets/images/icons/love.png');
const fulledLoveIcon = require('@/assets/images/icons/filledLove.png');
const loveIconBg = require('@/assets/images/icons/loveBackground.png');

interface AnnouncementProps {
  item: {
    id?: number;
    title?: string;
    content?: string;
    image?: string;
    loved?: boolean;
  };
}

export default function Announcement({ item }: AnnouncementProps) {
  const [fontsLoaded] = useFonts({
    AlexandriaRegular: require('../../assets/fonts/Alexandria-Regular.ttf'),
    AlexandriaBold: require('../../assets/fonts/Alexandria-Bold.ttf'),
    AlexandriaSemiBold: require('../../assets/fonts/Alexandria-SemiBold.ttf'),
  });

  const [loved, setLoved] = useState<boolean>(false);
  const { HandleLovingAnnouncement } = useFetchHandlers();

  useEffect(() => {
    if (item?.loved) {
      setLoved(true);
    }
  }, [item]);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#0076DD" />
      </View>
    );
  }

  if (!item) return null;

  const handleLoveToggle = () => {
    setLoved((prev) => !prev);
    if (item.id) HandleLovingAnnouncement(item.id);
  };

  return (
    <View style={styles.container}>
      <Image source={announcementImg} style={styles.image} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title || 'لا يوجد عنوان'}</Text>
        <TouchableOpacity
          style={styles.loveContainer}
          onPress={handleLoveToggle}
        >
          <Image source={loveIconBg} style={styles.loveBg} />
          <Image
            source={loved ? fulledLoveIcon : loveIcon}
            style={styles.loveIcon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderColor: '#E0E0E0',
    borderWidth: 2,
    overflow: 'hidden',
    height: 340,
  },
  image: {
    width: '100%',
    height: 270,
  },
  textContainer: {
    padding: 20,
    position: 'relative',
  },
  title: {
    fontSize: 16,
    fontFamily: 'AlexandriaSemiBold',
    textAlign: 'right',
    color: '#333',
  },
  loveContainer: {
    position: 'absolute',
    top: 10,
    left: 20,
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loveBg: {
    width: 45,
    height: 45,
    position: 'absolute',
  },
  loveIcon: {
    width: 30,
    height: 30,
    zIndex: 1,
  },
});
