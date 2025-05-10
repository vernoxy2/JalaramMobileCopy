import React, { useState } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import CustomHeader from '../components/CustomHeader';
import CustomTextInput from '../components/CustomTextInput';
import CustomButton from '../components/CustomButton';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // const handleLogin = () => {
  //   if (!email || !password) {
  //     Alert.alert('Error', 'Please enter both email and password.');
  //     return;
  //   }

  //   auth()
  //     .signInWithEmailAndPassword(email, password)
  //     .then(userCredential => {
  //       console.log('User logged in:', userCredential.user);
  //       navigation.navigate('BottomNavigation');
  //     })
  //     .catch(error => {
  //       console.log(error);
  //       Alert.alert('Login Failed');
  //     });
  // };


  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
  
    auth()
      .signInWithEmailAndPassword(email, password)
      .then(async userCredential => {
        const uid = userCredential.user.uid;
  
        try {
          const userDoc = await firestore().collection('users').doc(uid).get();
  
          if (!userDoc.exists) {
            Alert.alert('Login Failed', 'User role not found.');
            return;
          }
  
          const userData = userDoc.data();
          const role = userData.role;
  
          if (role === 'Admin' || role === 'Printing' || role === 'Punching' || role === 'Slitting' ) {
            navigation.navigate('BottomNavigation', { role });
          }
           else {
            Alert.alert('Access Denied', 'Unknown user role.');
          }
        } catch (err) {
          console.error(err);
          Alert.alert('Error', 'Could not verify user role.');
        }
      })
      .catch(error => {
        console.log(error);
        Alert.alert('Login Failed', "Please Enter Valid Credentials");
      });
  };


  return (
    <View style={styles.loginMainContainer}>
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
    fontFamily:'Lato-Black'
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
