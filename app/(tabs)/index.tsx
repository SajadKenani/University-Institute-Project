import Contact from '@/components/ui/contact';
import Line from '@/components/ui/line';
import { useFonts } from 'expo-font';
import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';


export default function HomeScreen() {
  const [fontsLoaded] = useFonts({
    AlexandriaRegular: require("../../assets/fonts/Alexandria-Regular.ttf"),
    AlexandriaBold: require("../../assets/fonts/Alexandria-Bold.ttf"),
    AlexandriaSemiBold: require("../../assets/fonts/Alexandria-SemiBold.ttf"),
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#0076DD" />
      </View>
    );
  }
  return (
    <View style={{  marginTop: 60 }}>
      <View style={{ margin: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>``
        <View style={{ flexDirection: "row", justifyContent: "space-between", width: 70 }}>
          <Contact status="onlyIcon" />
          <Contact status="onlyIcon" />
        </View>
        <View>
          <Text style={styles.morningText}> مساء الخير! </Text>
          <Text style={styles.studentNameText}> محمد علي حسن </Text>
          <Text style={styles.classNameText}> الدراســــة الأعدادية • الخامس الأعدادي </Text>
        </View>
      </View>

      <Line />
    </View>
  );
}
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  }

});