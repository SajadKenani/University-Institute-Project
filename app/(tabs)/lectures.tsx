import useFetchHandlers from '@/components/auth/APIs';
import Contact from '@/components/ui/contact';
import Line from '@/components/ui/line';
import Subject from '@/components/ui/subject';
import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';

export default function TabTwoScreen() {
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const {
    HandleStudentInfoFetching,
    HandleSubjectsFetching,
  } = useFetchHandlers();

  useEffect(() => {
    HandleStudentInfoFetching(setStudentInfo)
    HandleSubjectsFetching(setSubjects)
    
  }, [])

  const now = new Date();
  const timeString = now.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
  const amPm = timeString.split(' ')[1];

  // Function to chunk array into groups of 3
  const chunkArray = (array: any[], chunkSize: number) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  };

  const subjectRows = chunkArray(subjects, 3);

  return (
    <ScrollView style={{ marginTop: 60 }}>
      <View style={styles.headerContainer}>
        <View style={styles.iconContainer}>
          <Contact status="onlyIcon" />
          <Contact status="onlyIcon" />
        </View>
        <View>
          <Text style={styles.morningText}> {amPm === "AM" ? "صباح الخير" : "مساء الخير"}! </Text>
          <Text style={styles.studentNameText}> {studentInfo?.name} </Text>
          <Text style={styles.classNameText}>
            الدراســــة الأعدادية • {studentInfo?.grade}
          </Text>
        </View>
      </View>

      <Line />

      <View style={styles.subjectsContainer}>
        <Text style={styles.annoucementTitle}> أختر المادة </Text>
        {subjectRows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.subjectRow}>
            {row.map((item, colIndex) => (
              <TouchableOpacity key={`${rowIndex}-${colIndex}`} style={styles.subjectItem}>
                <Subject item={item} />
              </TouchableOpacity>
            ))}
            {/* Fill empty spaces in incomplete rows */}
            {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, emptyIndex) => (
              <View key={`empty-${rowIndex}-${emptyIndex}`} style={styles.subjectItem} />
            ))}
          </View>
        ))}
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
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
    marginTop: 0,
    marginBottom: 20,
    marginRight: 10,
  },
  lecturesTitle: {
    fontFamily: 'AlexandriaBold',
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
    marginTop: 30,
    marginRight: 10,
  },
  subjectsContainer: {
    marginTop: 20,
    marginHorizontal: 15,
    marginBottom: 20,
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  subjectItem: {
    flex: 1,
    marginHorizontal: 5,
  },
});