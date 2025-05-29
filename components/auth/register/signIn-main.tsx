import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { useFonts } from "expo-font";
import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Image } from "react-native";
import Welcome from "./welcome";
import { Ionicons } from '@expo/vector-icons';
import Contact from "@/components/ui/contact";
import useFetchHandlers from "@/components/auth/APIs";
import SpinningImage from "@/components/ui/spinner";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SignIn({ onLoginSuccess }: any) {
  const [isWelcomeActivated, setIsWelcomeActivated] = useState(false);
  const [isLoading , setIsLoading] = useState(false);
  const [loginInfo, setLoginInfo] = useState({
    email: '',
    password: ''
  });

  const [fontsLoaded] = useFonts({
    AlexandriaRegular: require('../../../assets/fonts/Alexandria-Regular.ttf'),
  });

  const { HandleSignIn } = useFetchHandlers();

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#0076DD" />
      </View>
    );
  }

 

  if (!isWelcomeActivated) {
    return <Welcome setIsWelcomeActivated={setIsWelcomeActivated} />
  }

  return (
    <View style={{ marginHorizontal: 16, marginTop: 60 }}>
      <View style={styles.upperBar}>
        <TouchableOpacity onPress={() => setIsWelcomeActivated(false)}>
          <Ionicons name="chevron-back" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.signInUpperText}>تسجيل الدخول</Text>
        <Ionicons name="chevron-back" size={26} color="transparent" />
      </View>

      {isLoading && (
        <View style={{display: "flex", alignItems: "center", marginTop: 50}}> 
        <SpinningImage size={35} /> </View>
      )}

      <Text style={styles.helloText}>أهلا بعودتك</Text>
      <Text style={styles.secondaryHelloText}>
        يرجى ادخال البريد الخاص بك و كلمة السر للمتابعة
      </Text>

      <Input
       aria-disabled={isLoading}
        placeholder="بريدك الالكتروني"
        value={loginInfo.email}
        onChangeText={(text) => setLoginInfo({ ...loginInfo, email: text })}
      />
      <Input
        aria-disabled={isLoading}
        placeholder="كلمة السر"
        secureTextEntry
        value={loginInfo.password}
        onChangeText={(text) => setLoginInfo({ ...loginInfo, password: text })}
      />

      <View style={{ marginTop: 10 }}>
        <Button disabled={isLoading} title="تسجيل الدخول" 
        onPress={() => {setIsLoading(true); HandleSignIn({loginInfo, setIsLoading})}} />
      </View>
      <View style={{ marginTop: 10 }}>
        <Button disabled={isLoading} textOnly title="ليس لدي حساب" />
      </View>
      <View style={{
        marginTop: 40, flexDirection: "row", justifyContent: "center", alignItems: "center"
      }}>
        <Contact status="withTitle" title="الأتصال بالدعم" />
      </View>
      <View style={{ marginTop: 120 }}>
        <Text style={styles.privaryText}>بأستخدامك للتطبيق فانت توافق ضمنيا على</Text>
        <Text style={styles.privacyBlueText}>ساسية الاستخدام و الخصوصية</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  upperBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  signInUpperText: {
    fontFamily: "AlexandriaRegular",
    color: "black",
    textAlign: "center",
    fontSize: 14,
    marginTop: 6,
  },
  helloText: {
    fontFamily: "AlexandriaRegular",
    color: "black",
    textAlign: "right",
    fontSize: 18,
    marginTop: 40,
  },
  secondaryHelloText: {
    fontFamily: "AlexandriaRegular",
    color: "rgba(134, 142, 150, 1)",
    textAlign: "right",
    fontSize: 12,
    marginBottom: 20,
    marginTop: 4,
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
    marginTop: 4
  }
});
