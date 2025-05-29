import { useFonts } from "expo-font";
import { ActivityIndicator, View, Image, Text, StyleSheet } from "react-native";
import { VITE_SERVER_URL } from "@env"

export default function Lecture({ item }: any) {
  const [fontsLoaded] = useFonts({
    AlexandriaRegular: require('../../assets/fonts/Alexandria-Regular.ttf'),
    AlexandriaBold: require('../../assets/fonts/Alexandria-Bold.ttf'),
    AlexandriaSemiBold: require('../../assets/fonts/Alexandria-SemiBold.ttf'),
  });

  const icon = require('@/assets/images/icons/love.png');
  const getFullPath = (path: string) => {
    if (!path) return "";
    return path.startsWith("http") ? path : `${VITE_SERVER_URL}/${path}`;
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
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <Image style={styles.image} source={getFullPath(item?.thumbnail) || icon} />
        </View>
      </View>
      <Text style={styles.title}> {item?.title} </Text>
      <Text style={styles.subTitle}> {item?.description} </Text>
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
    alignItems: 'flex-end', // Center the content
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    height: 150,
    width: '100%', // Use percentage instead of fixed width

  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 16,
    fontFamily: 'AlexandriaRegular',
    textAlign: 'right',
    color: '#333',
    marginTop: 8,
  },
  subTitle: {
    fontSize: 12,
    fontFamily: 'AlexandriaRegular',
    textAlign: 'right',
    color: '#9F9F9F',
    marginTop: 4,
  }
});