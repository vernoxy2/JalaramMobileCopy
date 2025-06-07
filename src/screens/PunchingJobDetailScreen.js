import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Button,
  Alert,
  TextInput,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import CustomHeader from '../components/CustomHeader';
import CustomDropdown from '../components/CustomDropdown';
import {paperProductCode} from '../constant/constant';
import {format} from 'date-fns';

const PunchingJobDetailsScreen = ({route, navigation}) => {
  const {order} = route.params;

  const [paperProduct, setPaperProduct] = useState(
    order.paperProductCode || '',
  );

  const [paperProductNo, setPaperProductNo] = useState(
    typeof order.paperProductNo === 'string' ||
      typeof order.paperProductNo === 'number'
      ? String(order.paperProductNo)
      : '',
  );

  const [runningMtrValue, setRunningMtrValue] = useState(
    typeof order.runningMtr === 'string' || typeof order.runningMtr === 'number'
      ? String(order.runningMtr)
      : '',
  );

  const handleComplete = async () => {
    try {
      const jobRef = firestore().collection('orders').doc(order.id);

      await jobRef.update({
        jobStatus: 'Slitting', // marks it completed for punching
        paperProductCode: paperProduct || order.paperProductCode || '',
        paperProductNo: paperProductNo || order.paperProductNo || '',
        runningMtr: runningMtrValue ? parseFloat(runningMtrValue) : null,
        updatedByPunchingAt: firestore.FieldValue.serverTimestamp(),
        assignedTo: 'sDdHMFBdkrhF90pwSk0g1ALcct33', // assign to slitting operator
      });

      Alert.alert('Success', 'Job marked as completed');

      // ✅ Navigate back to Punching screen
      navigation.goBack();
    } catch (error) {
      console.error('Error completing job:', error);
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
        {order.paperProductCode ? (
          <View style={styles.readOnlyField}>
            <Text style={styles.label}>Paper Product Code:</Text>
            <Text style={styles.value}>
              {typeof order.paperProductCode === 'object'
                ? order.paperProductCode.label
                : order.paperProductCode}
            </Text>
          </View>
        ) : (
          <CustomDropdown
            placeholder={'Select Paper Product Code'}
            data={paperProductCode}
            style={styles.dropdownContainer}
            selectedText={styles.dropdownText}
            onSelect={item => setPaperProduct(item)}
            showIcon={true}
          />
        )}

        <Text style={styles.label}>Paper Product No</Text>
        {order.paperProductNo ? (
          <Text style={styles.value}>{order.paperProductNo}</Text>
        ) : (
          <TextInput
            style={styles.input}
            value={paperProductNo}
            onChangeText={setPaperProductNo}
            placeholder="Enter Paper Product No"
          />
        )}

        <Text style={styles.label}>Job Card No:</Text>
        <Text style={styles.value}>{order.jobCardNo}</Text>

        <Text style={styles.label}>Customer Name:</Text>
        <Text style={styles.value}>{order.customerName}</Text>

        <Text style={styles.label}>Job Date:</Text>
        <Text style={styles.value}>
          <Text style={styles.value}>
            {order.jobDate ? order.jobDate.toDate().toDateString() : 'N/A'}
          </Text>
        </Text>

        <Text style={styles.label}>Job Status:</Text>
        <Text style={styles.value}>{order.jobStatus}</Text>

        <Text style={styles.label}>Job Paper:</Text>
        <Text style={styles.value}>{order.jobPaper.label}</Text>

        <Text style={styles.label}>Job Size</Text>
        <Text style={styles.value}>{order.jobSize}</Text>

        <Text style={styles.label}>Printing Plate Size</Text>
        <Text style={styles.value}>{order.printingPlateSize.label}</Text>

        <Text style={styles.label}>Ups : Across</Text>
        <Text style={styles.value}>{order.upsAcross.label}</Text>

        <Text style={styles.label}>Around</Text>
        <Text style={styles.value}>{order.around.label}</Text>

        <Text style={styles.label}>Teeth Size</Text>
        <Text style={styles.value}>{order.teethSize.label}</Text>

        <Text style={styles.label}>Blocks</Text>
        <Text style={styles.value}>{order.blocks.label}</Text>

        <Text style={styles.label}>Winding Direction</Text>
        <Text style={styles.value}>{order.windingDirection.label}</Text>

        <Text style={styles.label}>Running Mtrs</Text>
        {order.runningMtr ? (
          <Text style={styles.value}>
            {typeof order.runningMtr === 'object'
              ? JSON.stringify(order.runningMtr)
              : order.runningMtr}
          </Text>
        ) : (
          <TextInput
            style={styles.input}
            value={runningMtrValue}
            onChangeText={setRunningMtrValue}
            placeholder="Enter Running Mtrs"
            keyboardType="numeric"
          />
        )}
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
    fontFamily: 'Lato-Black',
    fontSize: 16,
    marginTop: 15,
    color: '#333',
  },
  value: {
    fontSize: 16,
    marginBottom: 10,
    color: '#555',
    fontFamily: 'Lato-Regular',
    marginVertical: 5,
  },
  dropdownContainer: {
    width: '100%',
    borderRadius: 10,
    marginTop: 20,

    height: 40,
    justifyContent: 'space-between',

    paddingHorizontal: 20,
  },
  buttonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  readOnlyField: {
    marginTop: 20,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    fontSize: 14,
  },
});
