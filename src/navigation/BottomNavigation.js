import React from 'react';
import { Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import OperatorHomeScreen from '../screens/OperatorHomeScreen';
import NotificationScreen from '../screens/NotificationScreen';
import ProfileScreen from '../screens/ProfileScreen';

import homeIcon from '../assets/images/homeBottomImg.png';
import notificationIcon from '../assets/images/notificationBottomImg.png';
import profileIcon from '../assets/images/profileBottomImg.png';
import HomeScreen from '../screens/HomeScreen';
import PunchingHomeScreen from '../screens/PunchingHomeScreen';
import SlittingHomeScreen from '../screens/SlittingHomeScreen';

const Tab = createBottomTabNavigator();

const BottomNavigation = ({ route }) => {
  const  role  = route?.params?.role ??'admin';

  const HomeComponent = role === 'Admin'
    ? HomeScreen
    : role === 'Printing'
    ? OperatorHomeScreen
    : role === 'Punching'
    ? PunchingHomeScreen
    : role === 'Slitting'
    ? SlittingHomeScreen  // Add the component for 'slitting'
    : null;  // If there's no matching role, you can set a default or return null.

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        
        tabBarIcon: ({ focused }) => {
          let icon;

          if (route.name === 'Home') {
            icon = homeIcon;
          } else if (route.name === 'Notifications') {
            icon = notificationIcon;
          } else if (route.name === 'Profile') {
            icon = profileIcon;
          }

          return (
            <Image
              source={icon}
              style={{
                width: 24,
                height: 24,
                tintColor: focused ? '#007bff' : 'gray',
              }}
              resizeMode="contain"
            />
          );
        },
        tabBarHideOnKeyboard:true,
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeComponent} />
      {/* <Tab.Screen name="Notifications" component={NotificationScreen} /> */}
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default BottomNavigation;
