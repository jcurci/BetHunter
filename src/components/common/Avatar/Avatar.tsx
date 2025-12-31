import React, { useEffect } from "react";
import { View, Text, StyleSheet, ViewStyle, Image } from "react-native";
import { useProfileStore } from "../../../storage/profileStore";

interface AvatarProps {
  initials: string;
  size?: number;
  style?: ViewStyle;
  imageUri?: string | null; // Optional override, if not provided uses store
}

const Avatar: React.FC<AvatarProps> = ({ 
  initials, 
  size = 48,
  style,
  imageUri: propImageUri
}) => {
  const { profileImageUri, loadProfileImage } = useProfileStore();
  
  useEffect(() => {
    loadProfileImage();
  }, [loadProfileImage]);

  // Use prop imageUri if provided, otherwise use store
  const displayImageUri = propImageUri !== undefined ? propImageUri : profileImageUri;
  const fontSize = size * 0.5; 
  
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }, style]}>
      {displayImageUri ? (
        <Image
          source={{ uri: displayImageUri }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
          resizeMode="cover"
        />
      ) : (
        <Text style={[styles.initials, { fontSize }]}>
          {initials.toUpperCase()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#A09CAB",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  initials: {
    color: "#EAEAE5",
    fontWeight: "600",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});

export default Avatar;

