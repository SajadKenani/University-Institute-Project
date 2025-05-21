import Button from "@/components/ui/button";
import Contact from "@/components/ui/contact";
import { useFonts } from "expo-font";
import { Image, Text, View, StyleSheet, ActivityIndicator } from "react-native";

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

    return (
        <View style={{ marginRight: 16, marginLeft: 16, marginTop: 40 }}>

            <View style={styles.upperBar}>
                <Contact status="onlyIcon" />
                <Image style={{ width: 102, height: 40 }} source={wideLogo} />
                <Image style={{ width: 49, height: 28, marginTop: 4 }} source={lanIcon} />
            </View>

            <View style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", marginTop: 40 }}>
                <Image source={mainWelcome} style={{ width: 290, height: 242 }} />
            </View>

            <View style={{ marginTop: 12 }}>
                <Text style={styles.helloTitle}> اهلا وسهلا </Text>
                <Text style={styles.helloParagraph}>  منصة متكاملة للتعليم الالكتروني, محاضرات شاملة و سهولة استخدام فائقة </Text>
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
        color: "#868E96"
    }

})

