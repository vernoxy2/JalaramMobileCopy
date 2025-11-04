import React, {useState} from 'react';
import {View, Image, Text, StyleSheet, Alert} from 'react-native';
import CustomHeader from '../components/CustomHeader';
import CustomTextInput from '../components/CustomTextInput';
import CustomButton from '../components/CustomButton';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {CommonActions} from '@react-navigation/native';
import Loader from './Loader';

const LoginScreen = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // const handleLogin = () => {
  //   if (!email || !password) {
  //     Alert.alert('Error', 'Please enter both email and password.');
  //     return;
  //   }

  //   auth()
  //     .signInWithEmailAndPassword(email, password)
  //     .then(async userCredential => {
  //       const uid = userCredential.user.uid;

  //       try {
  //         const userDoc = await firestore().collection('users').doc(uid).get();

  //         if (!userDoc.exists) {
  //           Alert.alert('Login Failed', 'User role not found.');
  //           return;
  //         }

  //         const userData = userDoc.data();
  //         const role = userData.role;

  //         if (
  //           role === 'Admin' ||
  //           role === 'Printing' ||
  //           role === 'Punching' ||
  //           role === 'Slitting'
  //         ) {
  //           navigation.dispatch(
  //             CommonActions.reset({
  //               index: 0,
  //               routes: [
  //                 {
  //                   name: 'BottomNavigation',
  //                   params: {role},
  //                 },
  //               ],
  //             }),
  //           );
  //         } else {
  //           Alert.alert('Access Denied', 'Unknown user role.');
  //         }
  //       } catch (err) {
  //         console.error(err);
  //         Alert.alert('Error', 'Could not verify user role.');
  //       }
  //     })
  //     .catch(error => {
  //       console.log(error);
  //       Alert.alert('Login Failed', 'Please Enter Valid Credentials');
  //     });
  // };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    if (loading) return; // prevent double tap
    setLoading(true);

    try {
      // Ensure any existing user is fully signed out before new login
      const currentUser = auth().currentUser;
      if (currentUser) {
        console.log(
          '⚠️ Existing user found, signing out before new login:',
          currentUser.uid,
        );
        await auth().signOut();
      }

      // Now safely sign in
      const userCredential = await auth().signInWithEmailAndPassword(
        email.trim(),
        password,
      );
      const uid = userCredential.user.uid;

      console.log('✅ Logged in successfully, UID:', uid);

      // Fetch Firestore role
      const userDoc = await firestore().collection('users').doc(uid).get();

      if (!userDoc.exists) {
        Alert.alert('Login Failed', 'User role not found.');
        setLoading(false);
        return;
      }

      const userData = userDoc.data();
      const role = userData.role;

      if (
        role === 'Admin' ||
        role === 'Printing' ||
        role === 'Punching' ||
        role === 'Slitting'
      ) {
        console.log('🔑 User role:', role);
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'BottomNavigation',
                params: {role},
              },
            ],
          }),
        );
      } else {
        Alert.alert('Access Denied', 'Unknown user role.');
      }
    } catch (error) {
      console.error('❌ Login Error:', error);
      Alert.alert('Login Failed', 'Please enter valid credentials.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <View style={styles.loginMainContainer}>
        <Loader visible={loading} />
      <CustomHeader show />
      <Image
        style={styles.loginScreenImg}
        source={require('../assets/images/loginScreenImg.webp')}
      />
      <Text style={styles.loginText}>Login</Text>

      <CustomTextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <CustomTextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <CustomButton
        title="Login"
        // title={loading ? 'Logging in...' : 'Login'}
        onPress={handleLogin}
        style={styles.loginBtn}
      />
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  loginMainContainer: {
    height: '100%',
    width: '100%',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  loginTopContainer: {
    height: '25%',
    backgroundColor: '#3668B1',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: 'center',
    width: '100%',
  },
  loginScreenImg: {
    height: 270,
    width: 270,
    resizeMode: 'contain',
    marginTop: -110,
  },
  loginText: {
    fontSize: 24,
    // fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Lato-Black',
  },
  loginTextInput: {
    height: 50,
    width: '90%',
    backgroundColor: '#f6f6f6',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginTop: 35,
    color: '#000',
  },
  btnContainer: {
    height: 50,
    width: '90%',
    borderRadius: 10,
    marginTop: 35,
    backgroundColor: '#3668B1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  loginBtn: {
    marginTop: 40,
  },
});
