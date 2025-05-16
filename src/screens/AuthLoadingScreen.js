import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const AuthLoadingScreen = ({ navigation }) => {
 useEffect(() => {
  const unsubscribe = auth().onAuthStateChanged(async (user) => {
    console.log("Auth state changed. User:", user);

    if (user) {
      try {
        const userDoc = await firestore().collection('users').doc(user.uid).get();
        console.log("User document fetched:", userDoc.exists);

        if (userDoc.exists) {
          const { role } = userDoc.data();
          console.log("Navigating to BottomNavigation with role:", role);
          navigation.replace('BottomNavigation', { role });
        } else {
          console.log("User document does not exist, redirecting to Login");
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      } catch (err) {
        console.error("Error fetching user doc:", err);
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    } else {
      console.log("No user found, redirecting to Login");
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  });

  return unsubscribe;
}, []);


  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#3668B1" />
    </View>
  );
};

export default AuthLoadingScreen;
