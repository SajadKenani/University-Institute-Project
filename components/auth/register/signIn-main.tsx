import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { useFonts } from "expo-font";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";

export default function SignIn({ onLoginSuccess }: any) {
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
    <View style={{ marginRight: 16, marginLeft: 16, marginTop: 20 }}>
      <View>
        <Text style={styles.signInUpperText}> تسجيل الدخول </Text>
      </View>

      <View>
        <Text style={styles.helloText}> أهلا بعودتك </Text>
      </View>
      <View>
        <Text style={styles.secondaryHelloText}> يرجى ادخال البريد الخاص بك و كلمة السر للمتابعة </Text>
      </View>

      <Input placeholder="بريدك الالكتروني" />
      <Input placeholder="كلمة السر" />
      <View style={{ marginTop: 10 }}>
        <Button title="تسجيل الدخول" />
      </View>
      <View style={{ marginTop: 10 }}>
        <Button textOnly title="ليس لدي حساب" />
      </View>

      <View style={{ marginTop: 120 }}>
        <Text style={styles.privaryText}>
          بأستخدامك للتطبيق فانت توافق ضمنيا على
        </Text>
        <Text style={styles.privacyBlueText}>
          ساسية الاستخدام و الخصوصية
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  signInUpperText: {
    fontFamily: "AlexandriaRegular",
    color: "black",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 14,
    marginTop: 20
  },
  helloText: {
    fontFamily: "AlexandriaRegular",
    color: "black",
    textAlign: "right",
    fontSize: 18,
    marginTop: 40,
    marginBottom: 0
  },
  secondaryHelloText: {
    fontFamily: "AlexandriaRegular",
    color: "rgba(134, 142, 150, 1)",
    textAlign: "right",
    fontSize: 12,
    marginBottom: 20,
    marginTop: 4
  },
  privaryText: {
    textAlign: "center",
    fontFamily: "AlexandriaRegular",
    fontSize: 11,
    color: "#868E96"
  },
  privacyBlueText: {
    textAlign: "center",
    fontFamily: "AlexandriaRegular",
    fontSize: 11,
    color: "#0076DD",
  }

});