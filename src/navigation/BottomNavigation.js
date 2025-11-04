// import React from 'react';
// import {Image} from 'react-native';
// import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
// import OperatorHomeScreen from '../screens/OperatorHomeScreen';
// import NotificationScreen from '../screens/NotificationScreen';
// import ProfileScreen from '../screens/ProfileScreen';

// import homeIcon from '../assets/images/homeBottomImg.png';
// import notificationIcon from '../assets/images/notificationBottomImg.png';
// import profileIcon from '../assets/images/profileBottomImg.png';
// import HomeScreen from '../screens/HomeScreen';
// import PunchingHomeScreen from '../screens/PunchingHomeScreen';
// import SlittingHomeScreen from '../screens/SlittingHomeScreen';

// const Tab = createBottomTabNavigator();

// const BottomNavigation = ({route}) => {
//   const role = route?.params?.role ?? 'admin';

//   const HomeComponent =
//     role === 'Admin'
//       ? HomeScreen
//       : role === 'Printing'
//       ? OperatorHomeScreen
//       : role === 'Punching'
//       ? PunchingHomeScreen
//       : role === 'Slitting'
//       ? SlittingHomeScreen // Add the component for 'slitting'
//       : null; // If there's no matching role, you can set a default or return null.

//   return (
//     <Tab.Navigator
//       screenOptions={({route}) => ({
//         tabBarIcon: ({focused}) => {
//           let icon;

//           if (route.name === 'Home') {
//             icon = homeIcon;
//           } else if (route.name === 'Notifications') {
//             icon = notificationIcon;
//           } else if (route.name === 'Profile') {
//             icon = profileIcon;
//           }

//           return (
//             <Image
//               source={icon}
//               style={{
//                 width: 24,
//                 height: 24,
//                 tintColor: focused ? '#007bff' : 'gray',
//               }}
//               resizeMode="contain"
//             />
//           );
//         },
//         tabBarHideOnKeyboard: true,
//         tabBarActiveTintColor: '#007bff',
//         tabBarInactiveTintColor: 'gray',
//         headerShown: false,
//       })}>
//       <Tab.Screen name="Home" component={HomeComponent} />
//       {/* <Tab.Screen name="Notifications" component={NotificationScreen} /> */}
//       <Tab.Screen name="Profile" component={ProfileScreen} />
//     </Tab.Navigator>
//   );
// };

// export default BottomNavigation;

import React from 'react';
import {Image} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import OperatorHomeScreen from '../screens/OperatorHomeScreen';
import PunchingHomeScreen from '../screens/PunchingHomeScreen';
import SlittingHomeScreen from '../screens/SlittingHomeScreen';
import AdminJobDetailsScreen from '../screens/AdminJobDetailsScreen';
import PunchingJobDetailsScreen from '../screens/PunchingJobDetailScreen';
import SlittingJobDetailsScreen from '../screens/SlittingJobDetailsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import OperatorCreateOrder from '../screens/OperatorCreateOrder';
import AdminCreateOrder from '../screens/AdminCreateOrder';

import homeIcon from '../assets/images/homeBottomImg.png';
import profileIcon from '../assets/images/profileBottomImg.png';
// import notificationIcon from '../assets/images/notificationBottomImg.png';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/* 🧩 Role-Specific Stacks */
const AdminStack = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="AdminHome" component={HomeScreen} />
    <Stack.Screen name="AdminJobDetails" component={AdminJobDetailsScreen} />
    <Stack.Screen name="AdminCreateOrder" component={AdminCreateOrder} />
  </Stack.Navigator>
);

const PrintingStack = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="PrintingHome" component={OperatorHomeScreen} />
    <Stack.Screen name="OperatorCreateOrder" component={OperatorCreateOrder} />
  </Stack.Navigator>
);

const PunchingStack = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="PunchingHomeScreen" component={PunchingHomeScreen} />
    <Stack.Screen
      name="PunchingJobDetailsScreen"
      component={PunchingJobDetailsScreen}
    />
  </Stack.Navigator>
);

const SlittingStack = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="SlittingHomeScreen" component={SlittingHomeScreen} />
    <Stack.Screen
      name="SlittingJobDetailsScreen"
      component={SlittingJobDetailsScreen}
    />
  </Stack.Navigator>
);

const BottomNavigation = ({route}) => {
  const role = route?.params?.role ?? 'Admin';

  // Select correct stack based on user role
  const HomeComponent =
    role === 'Admin'
      ? AdminStack
      : role === 'Printing'
      ? PrintingStack
      : role === 'Punching'
      ? PunchingStack
      : role === 'Slitting'
      ? SlittingStack
      : AdminStack;

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused}) => {
          let icon;
          if (route.name === 'Home') icon = homeIcon;
          else if (route.name === 'Profile') icon = profileIcon;

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
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}>
      <Tab.Screen name="Home" component={HomeComponent} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default BottomNavigation;
