import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import CustomHeader from "../components/CustomHeader";
import CustomLabelTextInput from "../components/CustomLabelTextInput";
import CustomButton from "../components/CustomButton";
import firestore from '@react-native-firebase/firestore';

const AdminCreateOrder = ({ navigation }) => {
  const [poNo, setPoNo] = useState('');
  const [receivedDate, setReceivedDate] = useState('');
  const [billNo, setBillNo] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [jobCardNo, setJobCardNo] = useState('');
  const [jobName, setJobName] = useState('');
  const [jobDate, setJobDate] = useState('');
  const [jobSize, setJobSize] = useState('');
  const [jobQty, setJobQty] = useState('');

  const handleSubmit = async () => {
    // if (
    //     !poNo.trim() ||
    //     !receivedDate.trim() ||
    //     !billNo.trim() ||
    //     !customerName.trim() ||
    //     !jobCardNo.trim() ||
    //     !jobName.trim() ||
    //     !jobDate.trim() ||
    //     !jobSize.trim() ||
    //     !jobQty.trim()
    //   ) {
    //     Alert.alert('Missing Info', 'Please fill out all fields.');
    //     return;
    //   }

    const assignedUserUID = 'uqTgURHeSvONdbFs154NfPYND1f2';

    const orderData = {
      poNo,
      receivedDate,
      billNo,
      customerName,
      jobCardNo,
      jobName,
      jobDate,
      jobSize,
      jobQty,
      jobStatus: 'Printing',
      assignedTo: assignedUserUID,
      createdBy: 'Admin',
      createdAt: firestore.FieldValue.serverTimestamp()
    };

    try {
      await firestore().collection('orders').add(orderData);
      console.log('orderData', orderData);
      
      Alert.alert('Success', 'Order created and assigned to Printing Operator');
      navigation.goBack(); // or navigate to dashboard
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong. Try again.');
    }
  };

  return (
    <View style={styles.adminFormMainContainer}>
      <CustomHeader
        showHeadingSection1Container={true}
        showBackBtn
        showHeadingTextContainer={true}
        headingTitle={'Flexo Job Card'}
        showHeadingSection2Container
      />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.adminFormSubContainer}>

          {/* PO No */}
          <View style={styles.inputBackContainer}>
            <Text style={styles.inputLabel}>PO No :</Text>
            <TextInput style={styles.inputContainer} value={poNo} onChangeText={setPoNo} />
          </View>

          {/* Job Received Date */}
          <View style={styles.inputBackContainer}>
            <Text style={styles.inputLabel}>Job Recieved Date :</Text>
            <TextInput style={styles.inputContainer} value={receivedDate} onChangeText={setReceivedDate} />
          </View>

          {/* Bill No */}
          <View style={styles.inputBackContainer}>
            <Text style={styles.inputLabel}>Bill No :</Text>
            <TextInput style={styles.inputContainer} value={billNo} onChangeText={setBillNo} />
          </View>

          <CustomLabelTextInput label="Customer Name :" value={customerName} onChangeText={setCustomerName} />
          <CustomLabelTextInput label="Job Card No :" value={jobCardNo} onChangeText={setJobCardNo} />
          <CustomLabelTextInput label="Job Name :" value={jobName} onChangeText={setJobName} />
          <CustomLabelTextInput label="Job Date :" value={jobDate} onChangeText={setJobDate} />
          <CustomLabelTextInput label="Job Original Size :" value={jobSize} onChangeText={setJobSize} />
          <CustomLabelTextInput label="Job Qty :" value={jobQty} onChangeText={setJobQty} />

          <View style={styles.btnContainer}>
            <CustomButton
              title={'Submit'}
              style={styles.submitBtn}
              onPress={handleSubmit}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default AdminCreateOrder;


const styles = StyleSheet.create({
    adminFormMainContainer: {
        flex:1,
        backgroundColor: '#fff',
        
        
    },
    scrollContainer: {
        paddingBottom: 10,
        
    },
    adminFormSubContainer: {
        paddingHorizontal: 20,
        
    },
    inputBackContainer: {
        width: "80%",
        backgroundColor: '#f6f6f6',
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        marginTop: 20,
        padding: 10,
    },
    inputContainer: {
        flex: 1,
        marginLeft: 10,
        backgroundColor: '#fff',
        borderRadius: 5,
        padding: 8,
        color:'#000',
        fontFamily:'Lato-Regular',
        fontSize:14
    },
    inputLabel: {
        fontSize: 14,
        fontFamily:'Lato-Black'
    },
    submitBtn : {
        marginVertical:40,
        width:'100%'
    },
    btnContainer : {
        width:'100%',
        alignItems:'center'
    }
});
