import React from 'react';
import { View, Text, StyleSheet, ScrollView, Button, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import CustomHeader from '../components/CustomHeader';

const PunchingJobDetailsScreen = ({ route, navigation }) => {
  const { order } = route.params;

  const handleComplete = async () => {
    try {
      const jobRef = firestore().collection('orders').doc(order.id);
  
      await jobRef.update({
        jobStatus: 'Slitting',           // marks it completed for punching
        assignedTo: 'sDdHMFBdkrhF90pwSk0g1ALcct33' // assign to slitting operator
      });
  
      Alert.alert('Success', 'Job marked as completed');
  
      // ✅ Navigate back to Punching screen
      navigation.goBack();
  
    } catch (error) {
      console.error("Error completing job:", error);
      Alert.alert('Error', 'Failed to complete job');
    }
  };
  

  return (
    <View style={styles.container}>
      <CustomHeader
        showHeadingSection1Container
        showBackBtn
        showHeadingTextContainer
        headingTitle="Job Details"
        
      />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Job Card No:</Text>
        <Text style={styles.value}>{order.jobCardNo}</Text>

        <Text style={styles.label}>Customer Name:</Text>
        <Text style={styles.value}>{order.customerName}</Text>

        <Text style={styles.label}>Job Date:</Text>
        <Text style={styles.value}>{order.jobDate}</Text>

        <Text style={styles.label}>Job Status:</Text>
        <Text style={styles.value}>{order.jobStatus}</Text>

        {/* Add more job fields below as needed */}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button title="Complete" onPress={handleComplete} color="#4CAF50" />
      </View>
    </View>
  );
};

export default PunchingJobDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  label: {
    fontFamily:'Lato-Black',
    fontSize: 16,
    marginTop: 15,
    color: '#333',
  },
  value: {
    fontSize: 16,
    marginBottom: 10,
    color: '#555',
    fontFamily:'Lato-Regular',
    marginVertical:5
  },
  buttonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
});
