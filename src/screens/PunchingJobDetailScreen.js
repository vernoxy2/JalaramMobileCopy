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
import auth from '@react-native-firebase/auth';

const PunchingJobDetailsScreen = ({route, navigation}) => {
  const {order} = route.params;
  const isCompleted = order.punchingStatus === 'completed';

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

  const [paperCodeValue, setPaperCodeValue] = useState(
    typeof order.paperCode === 'string' || typeof order.paperCode === 'number'
      ? String(order.paperCode)
      : '',
  );
  const [isPunchingStart, setIsPunchingStart] = useState(
    order.isPunchingStart || false,
  );

  const handlePunchingComplete = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const jobRef = firestore().collection('orders').doc(order.id);

      await jobRef.update({
        jobStatus: 'Slitting',
        punchingStatus: 'completed',
        paperCode: paperCodeValue || '',
        updatedByPunchingAt: firestore.FieldValue.serverTimestamp(),
        assignedTo: 'sDdHMFBdkrhF90pwSk0g1ALcct33', // ✅ now it's OK to hand off to slitting operator
        completedByPunching: currentUser.uid,
      });

      Alert.alert('Success', 'Punching marked as completed');

      navigation.goBack();
    } catch (error) {
      console.error('Error completing punching:', error);
      Alert.alert('Error', 'Failed to complete punching');
    }
  };

  const handlePunchingStart = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const jobRef = firestore().collection('orders').doc(order.id);

      await jobRef.update({
        paperProductCode: paperProduct,
        paperProductNo: paperProductNo || order.paperProductNo || '',
        runningMtr: runningMtrValue ? parseFloat(runningMtrValue) : null,
        startByPunching: currentUser.uid,
        punchingStartAt: firestore.FieldValue.serverTimestamp(),
        isPunchingStart: true,
        punchingStatus: 'started',
        jobStatus: 'Punching', // ✅ make sure it's still Punching
      });

      Alert.alert('Success', 'Punching started');
      navigation.navigate('PunchingHomeScreen');

      // navigation.goBack();
    } catch (error) {
      console.error('Error punching start:', error);
      Alert.alert('Error', 'Failed to start punching');
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

      {!isPunchingStart ? (
        <>
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

            <Text style={styles.label}>Job Name:</Text>
            <Text style={styles.value}>{order.jobName}</Text>

            <Text style={styles.label}>Job Qty:</Text>
            <Text style={styles.value}>{order.jobQty}</Text>

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

            <Text style={styles.label}>Across Ups</Text>
            <Text style={styles.value}>{order.upsAcross.label}</Text>

            <Text style={styles.label}>Across Gap</Text>
            <Text style={styles.value}>{order.acrossGap}</Text>

            <Text style={styles.label}>Around</Text>
            <Text style={styles.value}>{order.around.label}</Text>

            <Text style={styles.label}>Around Gap</Text>
            <Text style={styles.value}>{order.aroundGap}</Text>

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
                onChangeText={text => {
                  // Allow only digits (0–9)
                  const numericValue = text.replace(/[^0-9]/g, '');
                  setRunningMtrValue(numericValue);
                }}
                placeholder="Enter Running Mtrs"
                keyboardType="numeric"
              />
            )}
          </ScrollView>
          {!isCompleted && (
            <View style={styles.buttonContainer}>
              <Button
                title="Punching Start"
                onPress={handlePunchingStart}
                color="#4CAF50"
              />
            </View>
          )}
        </>
      ) : (
        <View style={styles.homeSubContainer}>
          <Text style={styles.label}>Job Card No:</Text>
          <Text style={styles.value}>{order.jobCardNo}</Text>

          <Text style={styles.label}>Job Name:</Text>
          <Text style={styles.value}>{order.jobName}</Text>

          {order.jobType !== 'Printing' ? (
            <View>
              <Text style={styles.label}>Paper Code</Text>
              {order.paperCode ? (
                <Text style={styles.value}>
                  {typeof order.paperCode === 'object'
                    ? JSON.stringify(order.paperCode)
                    : order.paperCode}
                </Text>
              ) : (
                <TextInput
                  style={styles.input}
                  value={paperCodeValue}
                  onChangeText={setPaperCodeValue}
                  placeholder="Enter Paper Code"
                  // keyboardType="numeric"
                />
              )}
            </View>
          ) : null}

          {!isCompleted && (        
            <View style={styles.buttonContainer}>
              <Button
                title="Punching Complete"
                onPress={() => {
                  if (order.jobType !== 'Printing') {
                    if (!paperCodeValue?.trim() && !order.paperCode) {
                      Alert.alert(
                        'Missing Field',
                        'Please enter the Paper Code before completing punching.',
                      );
                      return;
                    }
                  }
                  handlePunchingComplete();
                }}
                color="#4CAF50"
              />
            </View>
          )}
        </View>
      )}
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
  homeSubContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
});
