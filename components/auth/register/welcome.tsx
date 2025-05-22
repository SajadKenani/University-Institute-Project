import Button from "@/components/ui/button";
import Contact from "@/components/ui/contact";
import { useFonts } from "expo-font";
import { Image, Text, View, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from "react-native";

// Use require directly here
const wideLogo = require("@/assets/images/wideLogo.png");
const lanIcon = require("@/assets/images/languageIcon.png");
const mainWelcome = require("@/assets/images/mainWelcome.png");

export default function Welcome({ setIsWelcomeActivated }: any) {
    const [fontsLoaded] = useFonts({
        AlexandriaRegular: require('../../../assets/fonts/Alexandria-Regular.ttf'),
    });

    if (!fontsLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#0076DD" />
            </View>
        );
    }

    const showAlert = () => {
    Alert.alert(
      'اختر لغة',
      'اختر لغة التطبيق',
      [
        {
          text: 'العربية',
          onPress: () => console.log('العربية'),
        },
        {
          text: 'English',
          onPress: () => console.log('English'),
        },
      ],
      { cancelable: false }
    );
  };

    return (
        <View style={{ marginRight: 16, marginLeft: 16, marginTop: 60 }}>

            <View style={styles.upperBar}>
                <Contact status="onlyIcon" />
                <Image style={{ width: 102, height: 40 }} source={wideLogo} />
                <TouchableOpacity onPress={showAlert}>
                    <Image style={{ width: 49, height: 28, marginTop: 4 }} source={lanIcon} />
                </TouchableOpacity>
            </View>

            <View style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", marginTop: 40 }}>
                <Image source={mainWelcome} style={{ width: 290, height: 242 }} />
            </View>

            <View style={{ marginTop: 12 }}>
                <Text style={styles.helloTitle}> أهلا و سهلا! </Text>
                <Text style={styles.helloParagraph}>  منصة متكاملة للتعليم الالكتروني, محاضرات شاملة وسهولة استخدام فائقة </Text>
            </View>

            <View style={{ marginTop: 40 }}>
                <Button title="تسجيل الدخول" onPress={() => setIsWelcomeActivated(true)} />
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    upperBar: {
        display: "flex",
        width: "100%",
        justifyContent: "space-between",
        flexDirection: "row",
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
    },
    helloTitle: {
        fontFamily: "AlexandriaRegular",
        fontWeight: 400,
        fontSize: 22,
        textAlign: "center",
    },
    helloParagraph: {
        fontFamily: "AlexandriaRegular",
        fontWeight: 400,
        fontSize: 12,
        textAlign: "center",
        marginTop: 10,
        color: "#868E96",
        lineHeight: 20
    }

})

