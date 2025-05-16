// SplashScreen.js
import React, { useEffect } from "react";
import { View, Text, Image, StyleSheet } from 'react-native';

const SplashScreen = ({ navigation }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            navigation.replace("AuthLoadingScreen");
        }, 3000);

        return () => clearTimeout(timer); // cleanup timer
    }, [navigation]);

    return (
        <View style={styles.SplashMainContainer}>
            <Image
                style={styles.SplashImg}
                source={require('../assets/images/splashImg.png')}
            />
            <Text style={styles.SplashText}>
                SHRI JALARAM LABELS
            </Text>
        </View>
    );
};

export default SplashScreen;

const styles = StyleSheet.create({
    SplashMainContainer: {
        height: '100%',
        width: '100%',
        backgroundColor: '#3668B1',
        alignItems: 'center',
        justifyContent: 'center'
    },
    SplashImg: {
        height: "45%",
        width: "80%",
        resizeMode: 'contain',
    },
    SplashText: {
        fontSize: 20,
        color: "#FFF",
        fontWeight: 'bold'
    }
});
