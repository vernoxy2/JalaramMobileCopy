import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import CustomHeader from '../components/CustomHeader';
import CustomLabelTextInput from '../components/CustomLabelTextInput';
import CustomButton from '../components/CustomButton';
import firestore from '@react-native-firebase/firestore';
import CustomDropdown from '../components/CustomDropdown';
import {
  around,
  blocks,
  labelType,
  options,
  printingPlateSize,
  teethSize,
  upsAcross,
  windingDirection,
} from '../constant/constant';

const AdminCreateOrder = ({navigation}) => {
  const [poNo, setPoNo] = useState('');
  const [receivedDate, setReceivedDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [jobCardNo, setJobCardNo] = useState('');
  const [jobName, setJobName] = useState('');
  const [jobDate, setJobDate] = useState('');
  const [jobSize, setJobSize] = useState('');
  const [jobQty, setJobQty] = useState('');
  const [jobPaper, setJobPaper] = useState('');
  const [plateSize, setPlateSize] = useState('');
  const [upsAcrossValue, setUpsAcrossValue] = useState('');
  const [aroundValue, setAroundValue] = useState('');
  const [teethSizeValue, setTeethSizeValue] = useState('');
  const [blocksValue, setBlocksValue] = useState('');
  const [windingDirectionValue, setWindingDirectionValue] = useState('');
  const [checkboxState, setCheckboxState] = useState({
    box1: false,
    box2: false,
    box3: false,
  });
  const [selectedLabelType, setSelectedLabelType] = useState('');

  const printingColors = [];
  if (checkboxState.box1) printingColors.push('Uv');
  if (checkboxState.box2) printingColors.push('Water');
  if (checkboxState.box3) printingColors.push('Special');

  const handleCheckboxChange = box => {
    setCheckboxState(prevState => ({
      ...prevState,
      [box]: !prevState[box],
    }));
  };

  const handleSubmit = async () => {
    console.log('Selected Label Type:', selectedLabelType);
    const normalizedLabelType = selectedLabelType.trim().toLowerCase();
    let assignedUserUID;
    let jobStatus;

    if (normalizedLabelType === 'printing') {
      assignedUserUID = 'uqTgURHeSvONdbFs154NfPYND1f2';
      jobStatus = 'Printing';
    } else if (normalizedLabelType === 'plain') {
      assignedUserUID = 'Kt1bJQzaUPdAowP7bTpdNQEfXKO2';
      jobStatus = 'Punching'; // ✅ Change this to match PunchingHomeScreen
    } else {
      Alert.alert('Error', 'Please select a valid Label Type');
      return;
    }

    const orderData = {
      poNo,
      receivedDate,
      customerName,
      jobCardNo,
      jobName,
      jobDate,
      jobSize,
      jobQty,
      jobStatus,
      assignedTo: assignedUserUID,
      createdBy: 'Admin',
      createdAt: firestore.FieldValue.serverTimestamp(),
      jobPaper,
      printingPlateSize: plateSize,
      upsAcross: upsAcrossValue,
      around: aroundValue,
      teethSize: teethSizeValue,
      blocks: blocksValue,
      windingDirection: windingDirectionValue,
      printingColors,
    };

    try {
      await firestore().collection('orders').add(orderData);
      console.log('orderData', orderData);

      Alert.alert('Success', 'Job Created');
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
            <TextInput
              style={styles.inputContainer}
              value={poNo}
              onChangeText={setPoNo}
            />
          </View>

          {/* Job Received Date */}
          <View style={styles.inputBackContainer}>
            <Text style={styles.inputLabel}>Job Recieved Date :</Text>
            <TextInput
              style={styles.inputContainer}
              value={receivedDate}
              onChangeText={setReceivedDate}
            />
          </View>

          <CustomLabelTextInput
            label="Customer Name :"
            value={customerName}
            onChangeText={setCustomerName}
          />
          <CustomLabelTextInput
            label="Job Card No :"
            value={jobCardNo}
            onChangeText={setJobCardNo}
          />
          <CustomLabelTextInput
            label="Job Name :"
            value={jobName}
            onChangeText={setJobName}
          />
          <CustomLabelTextInput
            label="Job Date :"
            value={jobDate}
            onChangeText={setJobDate}
          />
          <CustomLabelTextInput
            label="Job Original Size :"
            value={jobSize}
            onChangeText={setJobSize}
          />
          <CustomLabelTextInput
            label="Job Qty :"
            value={jobQty}
            onChangeText={setJobQty}
          />
          <CustomDropdown
            placeholder={'Job Paper / Film Material'}
            data={options}
            style={styles.dropdownContainer}
            selectedText={styles.dropdownText}
            onSelect={item => setJobPaper(item)}
            showIcon={true}
          />
          <CustomDropdown
            placeholder={'Printing Plate Size'}
            data={printingPlateSize}
            style={styles.dropdownContainer}
            selectedText={styles.dropdownText}
            onSelect={item => setPlateSize(item)}
            showIcon={true}
          />
          <CustomDropdown
            placeholder={'Ups : Across'}
            data={upsAcross}
            style={styles.dropdownContainer}
            selectedText={styles.dropdownText}
            onSelect={item => setUpsAcrossValue(item)}
            showIcon={true}
          />
          <CustomDropdown
            placeholder={'Around'}
            data={around}
            style={styles.dropdownContainer}
            selectedText={styles.dropdownText}
            onSelect={item => setAroundValue(item)}
            showIcon={true}
          />
          <CustomDropdown
            placeholder={'Teeth Size'}
            data={teethSize}
            style={styles.dropdownContainer}
            selectedText={styles.dropdownText}
            onSelect={item => setTeethSizeValue(item)}
            showIcon={true}
          />
          <CustomDropdown
            placeholder={'Blocks'}
            data={blocks}
            style={styles.dropdownContainer}
            selectedText={styles.dropdownText}
            onSelect={item => setBlocksValue(item)}
            showIcon={true}
          />
          <CustomDropdown
            placeholder={'Winding Direction'}
            data={windingDirection}
            style={styles.dropdownContainer}
            selectedText={styles.dropdownText}
            onSelect={item => setWindingDirectionValue(item)}
            showIcon={true}
          />

          <View style={styles.container}>
            <View style={styles.printingContainer}>
              <Text style={styles.dropdownText}>Printing Colours:</Text>

              {['Uv', 'Water', 'Special'].map((label, index) => {
                const boxKey = `box${index + 1}`;
                return (
                  <TouchableOpacity
                    key={label}
                    style={styles.checkboxContainer}
                    onPress={() => handleCheckboxChange(boxKey)}>
                    <View
                      style={[
                        styles.checkbox,
                        checkboxState[boxKey] && styles.checked,
                      ]}>
                      {checkboxState[boxKey] && (
                        <Image
                          style={styles.checkmarkImage}
                          source={require('../assets/images/check.png')}
                        />
                      )}
                    </View>
                    <Text style={styles.checkboxText}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <CustomDropdown
            placeholder={'Label Type'}
            data={labelType}
            style={styles.dropdownContainer}
            selectedText={styles.dropdownText}
            showIcon={true}
            onSelect={item => setSelectedLabelType(item.value)}
          />

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
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    paddingBottom: 10,
  },
  adminFormSubContainer: {
    paddingHorizontal: 20,
  },
  inputBackContainer: {
    width: '80%',
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
    color: '#000',
    fontFamily: 'Lato-Regular',
    fontSize: 14,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Lato-Black',
  },
  submitBtn: {
    marginVertical: 40,
    width: '100%',
  },
  btnContainer: {
    width: '100%',
    alignItems: 'center',
  },
  dropdownContainer: {
    width: '100%',
    borderRadius: 10,
    marginTop: 20,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'flex-start',
    width: 70,
  },
  dropdownText: {
    fontSize: 14,
    fontFamily: 'Lato-Black',
    color: '#000',
    marginVertical: 10,
  },
  checkbox: {
    width: 15,
    height: 15,
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  checked: {
    backgroundColor: '#000',
  },
  checkmarkImage: {
    height: 10,
    width: 10,
    tintColor: '#fff',
  },
  checkboxText: {
    fontSize: 14,
    fontFamily: 'Lato-Regular',
    color: '#000',
    marginLeft: 10,
  },
});
