import React, {useEffect, useRef} from 'react';
import {View, Text, Image, StyleSheet, Animated, Easing} from 'react-native';

const SplashScreen = ({navigation}) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // run both scale and opacity animations together
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('AuthLoadingScreen');
    }, 3500);

    return () => clearTimeout(timer);
  }, [navigation, scaleAnim, opacityAnim]);

  return (
    <View style={styles.SplashMainContainer}>
      <Animated.Image
        style={[
          styles.SplashImg,
          {transform: [{scale: scaleAnim}], opacity: opacityAnim},
        ]}
        source={require('../assets/images/splashImg.png')}
      />
      <Animated.Text
        style={[
          styles.SplashText,
          {opacity: opacityAnim, transform: [{scale: scaleAnim}]},
        ]}>
        SHRI JALARAM LABELS
      </Animated.Text>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  SplashMainContainer: {
    flex: 1,
    backgroundColor: '#3668B1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  SplashImg: {
    height: '45%',
    width: '80%',
    resizeMode: 'contain',
  },
  SplashText: {
    fontSize: 30,
    color: '#FFF',
    fontWeight: 'bold',
    marginTop: 60,
    letterSpacing: 1.5,
  },
});
