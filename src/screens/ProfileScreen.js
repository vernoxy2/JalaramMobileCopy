import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from 'react-native';
import CustomHeader from "../components/CustomHeader";
import CustomButton from "../components/CustomButton";
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const ProfileScreen = ({ navigation }) => {
    const [role, setRole] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserRole = async () => {
            try {
                const currentUser = auth().currentUser;
                if (currentUser) {
                    const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
                    if (userDoc.exists) {
                        setRole(userDoc.data().role);
                    } else {
                        console.warn('User document not found');
                    }
                }
            } catch (error) {
                console.error('Error fetching user role:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserRole();
    }, []);

    const handleSignOut = async () => {
        try {
            await auth().signOut();
            navigation.replace('Login');
        } catch (error) {
            console.error('Error signing out: ', error);
        }
    };

    return (
        <View style={styles.mainContainer}>
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
                        {loading ? 'Loading...' : role || 'Not Assigned'}
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


const styles = StyleSheet.create ({
    mainContainer: {
        height:'100%',
        width:'100%',
        backgroundColor:'#fff'
    },
    subContainer : {
        width:'100%',
        paddingHorizontal:20,
        height:'70%',
        flexDirection:'column',
        justifyContent:'space-between',
       
    },
    roleContainer : {
        backgroundColor:'#f6f6f6',
        display:'flex',
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'flex-start',
        paddingVertical:20,
        marginVertical:20,
        borderRadius:10
    },
    roleTxt : {
        fontSize: 14,
        fontFamily:'Lato-Black',
        color:'#000',
        marginLeft:20
    },
    btnContainer : {
        width:'100%'
    }
    
})