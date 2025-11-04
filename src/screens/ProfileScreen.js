import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import CustomHeader from '../components/CustomHeader';
import CustomButton from '../components/CustomButton';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Loader from './Loader';

const ProfileScreen = ({navigation}) => {
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //     const fetchUserRole = async () => {
  //         try {
  //             const currentUser = auth().currentUser;
  //             console.log('🔥 ProfileScreen currentUser:', currentUser);

  //             if (currentUser) {
  //                 console.log('🔥 ProfileScreen currentUser.uid:', currentUser.uid);
  //                 const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
  //                 if (userDoc.exists) {
  //                     setRole(userDoc.data().role);
  //                 } else {
  //                     console.warn('User document not found');
  //                 }
  //             }
  //         } catch (error) {
  //             console.error('Error fetching user role:', error);
  //         } finally {
  //             setLoading(false);
  //         }
  //     };

  //     fetchUserRole();
  // }, []);

  useEffect(() => {
    console.log('👀 ProfileScreen mounted');

    // Subscribe to Firebase auth state changes
    const unsubscribeAuth = auth().onAuthStateChanged(async user => {
      console.log('🧭 Auth state changed:', user ? user.uid : 'No user');

      // If user logs out, navigate immediately to login screen
      if (!user) {
        setRole('');
        setLoading(false);
        navigation.replace('Login');
        return;
      }

      // Otherwise, fetch user role from Firestore
      try {
        setLoading(true);
        const userDoc = await firestore()
          .collection('users')
          .doc(user.uid)
          .get();
        if (userDoc.exists) {
          const userRole = userDoc.data().role;
          console.log('✅ User role fetched:', userRole);
          setRole(userRole);
        } else {
          console.warn('⚠️ User document not found');
          setRole('Not Assigned');
        }
      } catch (error) {
        console.error('🔥 Error fetching user role:', error);
      } finally {
        setLoading(false);
      }
    });

    // Cleanup when component unmounts
    return () => {
      console.log('🧹 ProfileScreen unmounted');
      unsubscribeAuth();
    };
  }, [navigation]);

  //   const handleSignOut = async () => {
  //     try {
  //       await auth().signOut();
  //       setRole('');
  //       navigation.replace('Login');
  //     } catch (error) {
  //       console.error('Error signing out: ', error);
  //     }
  //   };

  const handleSignOut = async () => {
    try {
      console.log('Signing out user...');
      await auth().signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <View style={styles.mainContainer}>
       <Loader visible={loading} />
      <CustomHeader
        showHeadingSection1Container={true}
        showHeadingTextContainer={true}
        showHeadingSection2Container={true}
        showBackBtn={true}
        headingTitle={'Profile'}
      />

      <View style={styles.subContainer}>
        <View style={styles.roleContainer}>
          <Text style={styles.roleTxt}>Role:</Text>
          <Text style={styles.roleTxt}>
            {role}
          </Text>
        </View>

        <CustomButton
          onPress={handleSignOut}
          title={'Logout'}
          style={styles.btnContainer}
        />
      </View>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  mainContainer: {
    height: '100%',
    width: '100%',
    backgroundColor: '#fff',
  },
  subContainer: {
    width: '100%',
    paddingHorizontal: 20,
    height: '70%',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  roleContainer: {
    backgroundColor: '#f6f6f6',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 20,
    marginVertical: 20,
    borderRadius: 10,
  },
  roleTxt: {
    fontSize: 14,
    fontFamily: 'Lato-Black',
    color: '#000',
    marginLeft: 20,
  },
  btnContainer: {
    width: '100%',
  },
});
