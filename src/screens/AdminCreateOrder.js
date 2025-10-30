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
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import CustomHeader from '../components/CustomHeader';
import CustomLabelTextInput from '../components/CustomLabelTextInput';
import CustomButton from '../components/CustomButton';
import firestore from '@react-native-firebase/firestore';
import CustomDropdown from '../components/CustomDropdown';
import DatePicker from 'react-native-date-picker';
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
  const [receivedDate, setReceivedDate] = useState(new Date());
  const [openReceivedDate, setOpenReceivedDate] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [jobCardNo, setJobCardNo] = useState('');
  const [jobName, setJobName] = useState('');
  const [jobDate, setJobDate] = useState(new Date());
  const [openJobDate, setOpenJobDate] = useState(false);
  const [jobSize, setJobSize] = useState('');
  const [jobQty, setJobQty] = useState('');
  // const [tooling, setTooling] = useState('');
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
  const[accept,setAccept]=useState(false);

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
      jobStatus = 'Punching';
    } else {
      Alert.alert('Error', 'Please select a valid Label Type');
      return;
    }

    try {
      // 🔍 Check if jobCardNo already exists
      const snapshot = await firestore()
        .collection('orders')
        .where('jobCardNo', '==', jobCardNo)
        .get();

      if (!snapshot.empty) {
        Alert.alert(
          'Job Card No already exists!',
          'Enter another job card no.',
        );
        return;
      }

      const orderData = {
        poNo,
        receivedDate: firestore.Timestamp.fromDate(receivedDate),
        jobDate: firestore.Timestamp.fromDate(jobDate),
        customerName,
        jobCardNo,
        jobName,
        jobSize,
        jobQty,
        // tooling,
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
        punchingStatus: normalizedLabelType === 'printing' ? 'pending' : null,
            accept: accept,
        // punchingStatus: normalizedLabelType === 'plain' ? 'pending' : null,
      };

      await firestore().collection('orders').add(orderData);
      console.log('orderData', orderData);

      Alert.alert('Success', 'Job Created');
      navigation.goBack();
    } catch (error) {
      console.error('Submit Error:', error);
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

          <View style={styles.inputBackContainer}>
            <Text style={styles.inputLabel}>Job Date:</Text>
            <TouchableOpacity
              onPress={() => setOpenJobDate(true)}
              style={styles.inputContainer}>
              <Text>{jobDate.toDateString()}</Text>
            </TouchableOpacity>
          </View>
          <DatePicker
            modal
            mode="date"
            open={openJobDate}
            date={jobDate}
            minimumDate={new Date()} // No past dates
            onConfirm={date => {
              setOpenJobDate(false);
              setJobDate(date);
            }}
            onCancel={() => setOpenJobDate(false)}
          />

          {/* Job Received Date */}
          <View style={styles.inputBackContainer}>
            <Text style={styles.inputLabel}>Job Received Date:</Text>
            <TouchableOpacity
              onPress={() => setOpenReceivedDate(true)}
              style={styles.inputContainer}>
              <Text>{receivedDate.toDateString()}</Text>
            </TouchableOpacity>
          </View>

          <DatePicker
            modal
            mode="date"
            open={openReceivedDate}
            date={receivedDate}
            minimumDate={new Date()} // No past dates
            onConfirm={date => {
              setOpenReceivedDate(false);
              setReceivedDate(date);
            }}
            onCancel={() => setOpenReceivedDate(false)}
          />

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
            label="Job Original Size :"
            value={jobSize}
            onChangeText={setJobSize}
          />
          <CustomLabelTextInput
            label="Job Qty :"
            value={jobQty}
            onChangeText={setJobQty}
          />
          {/* <CustomLabelTextInput
            label="Tooling"
            value={tooling}
            onChangeText={setTooling}
          /> */}
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

          {/* <View style={styles.container}>
            <View style={styles.printingContainer}>
              <Text style={styles.dropdownText}>Printing Colors:</Text>

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
          </View> */}

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
    width: '100%',
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
