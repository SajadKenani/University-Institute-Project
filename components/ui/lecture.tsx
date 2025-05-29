import { useFonts } from "expo-font";
import { ActivityIndicator, View, Image, Text, StyleSheet } from "react-native";

export default function Lecture({ item }: any) {
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
        <Text style={styles.title}>الاملاح, القواعد و الحوامض..</Text>
        <Text style={styles.subTitle}>الكيمياء | الاملاح و الاحماض</Text>
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
      width: 60,
      height: 60,
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