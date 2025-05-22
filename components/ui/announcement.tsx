import { Image, View } from "react-native";

export default function Announcement({ title = "اعلان", image }: any) {
    const announcementIcon = require("@/assets/images/announcement.png");
    return (
        <View>
            {image ? <Image source={image} /> : <Image source={announcementIcon} />}
        </View>
    )

} 