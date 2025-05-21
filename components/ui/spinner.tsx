import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image } from 'react-native';

const SpinningImage = ({  size = 50 }) => {
  const spinAnim = useRef(new Animated.Value(0)).current;
const loader = require("@/assets/images/Loader.png");
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.Image
      source={loader}
      style={{
        width: size,
        height: size,
        transform: [{ rotate: spin }],
      }}
    />
  );
};

export default SpinningImage;
