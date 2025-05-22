import { useFonts } from "expo-font";
import { Text, View, Image, ActivityIndicator, StyleSheet } from "react-native";

// Define proper types for component props
interface ContactProps {
  status?: "onlyIcon" | "withTitle";
  title?: string;
}

const supportIcon = require("@/assets/images/support.png");

export default function Contact({ status = "withTitle", title = "Support" }: ContactProps) {
  const [fontsLoaded] = useFonts({
    AlexandriaRegular: require("../../assets/fonts/Alexandria-Regular.ttf"),
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#0076DD" />
      </View>
    );
  }

  return (
    <>
      {status === "onlyIcon" ? (
        <View style={styles.iconContainer}>
          <Image style={styles.icon} source={supportIcon} />
        </View>
      ) : (
        <View style={styles.container}>
          <Image style={styles.icon} source={supportIcon} />
          <Text style={styles.titleText}>{title}</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  container: {
    backgroundColor: "rgba(171, 223, 185, 0.45)",
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 16,
    height: 30,
  },
  iconContainer: {
    backgroundColor: "rgba(171, 223, 185, 0.45)",
    padding: 8,
    borderRadius: 16,
    height: 30,
    width: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 20,
    height: 20,
  },
  titleText: {
    fontFamily: "AlexandriaRegular",
    fontSize: 12,
    color: "#34C759",
    marginLeft: 8,
    fontWeight: "500",
  },
});