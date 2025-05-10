// StackNavigation.js
import React from "react";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from "../screens/LoginScreen";
import SplashScreen from "../screens/SplashScreen";

import BottomNavigation from "./BottomNavigation";
import AdminCreateOrder from "../screens/AdminCreateOrder";
import OperatorCreateOrder from "../screens/OperatorCreateOrder";
import MachineTestScreen from "../screens/MachineTestScreen";
import OperatorHomeScreen from "../screens/OperatorHomeScreen";
import PunchingHomeScreen from "../screens/PunchingHomeScreen";
import PunchingJobDetailsScreen from "../screens/PunchingJobDetailScreen";
import SlittingHomeScreen from "../screens/SlittingHomeScreen";
import AdminJobDetailsScreen from "../screens/AdminJobDetailsScreen";
import SlittingJobDetailsScreen from "../screens/SlittingJobDetailsScreen";


const Stack = createNativeStackNavigator();

const StackNavigation = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Splash">
                <Stack.Screen 
                    name="Splash" 
                    component={SplashScreen} 
                    options={{ headerShown: false }} 
                />
                <Stack.Screen 
                    name="Login" 
                    component={LoginScreen} 
                    options={{ headerShown: false }} 
                />
                 <Stack.Screen 
                    name="BottomNavigation" 
                    component={BottomNavigation} 
                    options={{ headerShown: false }} 
                />
                <Stack.Screen 
                    name="AdminCreateOrder" 
                    component={AdminCreateOrder} 
                    options={{ headerShown: false }} 
                />
                <Stack.Screen 
                    name="OperatorCreateOrder" 
                    component={OperatorCreateOrder} 
                    options={{ headerShown: false }} 
                />
                 <Stack.Screen 
                    name="MachineTestScreen" 
                    component={MachineTestScreen} 
                    options={{ headerShown: false }} 
                />
                <Stack.Screen 
                    name="OperatorHomeScreen" 
                    component={OperatorHomeScreen} 
                    options={{ headerShown: false }} 
                />
                <Stack.Screen 
                    name="PunchingHomeScreen" 
                    component={PunchingHomeScreen} 
                    options={{ headerShown: false }} 
                />
                <Stack.Screen 
                    name="PunchingJobDetailsScreen" 
                    component={PunchingJobDetailsScreen} 
                    options={{ headerShown: false }} 
                />
                <Stack.Screen 
                    name="SlittingHomeScreen" 
                    component={SlittingHomeScreen} 
                    options={{ headerShown: false }} 
                />
                <Stack.Screen 
                    name="SlittingJobDetailsScreen" 
                    component={SlittingJobDetailsScreen} 
                    options={{ headerShown: false }} 
                />
                <Stack.Screen 
                    name="AdminJobDetailsScreen" 
                    component={AdminJobDetailsScreen} 
                    options={{ headerShown: false }} 
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default StackNavigation;
