import useFetchHandlers from '@/components/auth/APIs';
import Announcement from '@/components/ui/announcement';
import Contact from '@/components/ui/contact';
import Lecture from '@/components/ui/lecture';
import Line from '@/components/ui/line';
import Subject from '@/components/ui/subject';
import { useFonts } from 'expo-font';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [lectures, setLectures] = useState<any[]>([]);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const { HandleAccouncementsFetching, HandleLecturesFetching, HandleStudentInfoFetching } = useFetchHandlers();

  const [fontsLoaded] = useFonts({
    AlexandriaRegular: require('../../assets/fonts/Alexandria-Regular.ttf'),
    AlexandriaBold: require('../../assets/fonts/Alexandria-Bold.ttf'),
    AlexandriaSemiBold: require('../../assets/fonts/Alexandria-SemiBold.ttf'),
  });

  useEffect(() => {
    HandleAccouncementsFetching(setAnnouncements);
    HandleLecturesFetching(setLectures)
    HandleStudentInfoFetching(setStudentInfo)
    console.log(announcements)
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#0076DD" />
      </View>
    );
  }

  return (
    <ScrollView style={{ marginTop: 60 }}>
      <View style={styles.headerContainer}>
        <View style={styles.iconContainer}>
          <Contact status="onlyIcon" />
          <Contact status="onlyIcon" />
        </View>
        <View>
          <Text style={styles.morningText}> مساء الخير! </Text>
          <Text style={styles.studentNameText}> {studentInfo?.name} </Text>
          <Text style={styles.classNameText}>
            الدراســــة الأعدادية • الخامس الأعدادي
          </Text>
        </View>
      </View>

      <Line />

      <Text style={styles.annoucementTitle}> اخر الاخبار </Text>

      <View style={{ height: 350 }}>
        {announcements?.length > 0 ? (
          <Carousel
            width={SCREEN_WIDTH}
            height={560}
            data={announcements}
            renderItem={({ item }) => (
              <Announcement item={item} />
            )}
            pagingEnabled={true}
            scrollAnimationDuration={1000}
            vertical={false}
            modeConfig={{
              parallaxScrollingScale: 0.95,
              parallaxScrollingOffset: 32,
            }}
            mode="parallax"
            autoPlay={true}
            autoPlayInterval={3000}
            loop
          />
        ) : (
          <Text style={{ textAlign: 'center', marginTop: 0 }}>
            لا توجد إعلانات حالياً
          </Text>
        )}
      </View>

      <Text style={styles.annoucementTitle}> المواد والمناهج </Text>

      <View style={{ height: 350, marginTop: 20, marginBottom: -180 }}>
        {announcements?.length > 0 ? (
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 10,
              flexDirection: 'row-reverse' // RTL layout
            }}
          >
            {announcements.map((item, index) => (
              <View
                key={index}
                style={{
                  width: SCREEN_WIDTH / 4 - 20, // 1/3 of screen width minus margins
                  marginLeft: 5, // Space between items

                }}
              >
                <Subject item={item} />
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={{ textAlign: 'center', marginTop: 0 }}>
            لا توجد مواد حالياً
          </Text>
        )}
      </View>
      <Line />

            <Text style={styles.lecturesTitle}> اخر المحاضرات </Text>

      <View style={{ height: 400, marginTop: 20 }}>
        {lectures?.length > 0 ? (
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 10,
              flexDirection: 'row-reverse' // RTL layout
            }}
          >
            {lectures.map((item, index) => (
              <View
                key={index}
                style={{
                  width: SCREEN_WIDTH / 2/0.8 - 20, // 1/3 of screen width minus margins
                  marginLeft: 10, // Space between items

                }}
              >
                <Lecture item={item} />
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={{ textAlign: 'center', marginTop: 0 }}>
            لا توجد مواد حالياً
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    margin: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 70,
  },
  morningText: {
    fontFamily: 'AlexandriaSemiBold',
    fontSize: 12,
    color: '#333',
    textAlign: 'right',
    marginTop: 20,
  },
  studentNameText: {
    fontFamily: 'AlexandriaBold',
    fontSize: 18,
    color: '#333',
    textAlign: 'right',
    marginTop: 10,
  },
  classNameText: {
    fontFamily: 'AlexandriaRegular',
    fontSize: 10,
    color: '#333',
    textAlign: 'right',
    marginTop: 16,
  },
  annoucementTitle: {
    fontFamily: 'AlexandriaBold',
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
    marginTop: 20,
    marginRight: 10,
  },
  lecturesTitle: {
    fontFamily: 'AlexandriaBold',
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
    marginTop: 30,
    marginRight: 10,
  }
});