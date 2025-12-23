import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import CustomHeader from '../components/CustomHeader';
import CustomLabelTextInput from '../components/CustomLabelTextInput';
import CustomButton from '../components/CustomButton';
import firestore from '@react-native-firebase/firestore';
import DatePicker from 'react-native-date-picker';
import {useRoute} from '@react-navigation/native';
import CustomDropdown from '../components/CustomDropdown';
import {options, paperProductCodeData} from '../constant/constant';
import Loader from './Loader';
import JobOriginalSizeInput from '../components/JobOriginalSizeInput ';
import {set} from 'date-fns';

const MaterialRequestPunching = ({navigation}) => {
  const [jobCardNo, setJobCardNo] = useState('');
  const [jobName, setJobName] = useState('');
  const [paperSize, setPaperSize] = useState('');
  const [additionalPaperRequired, setAdditionalPaperRequired] = useState('');
  const [jobPaper, setJobPaper] = useState('');
  const [requestDate, setRequestDate] = useState(new Date());
  const [openRequestDate, setOpenRequestDate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [jobLength, setJobLength] = useState('');
  const [jobWidth, setJobWidth] = useState('');
  const [jobQty, setJobQty] = useState('');
  const [paperProductCode, setPaperProductCode] = useState();
  const [customerName, setCustomerName] = useState('');

  const route = useRoute();
  const {id} = route.params || {};

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id, fetchOrderDetails]);

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      const doc = await firestore().collection('ordersTest').doc(id).get();

      if (doc.exists) {
        const data = doc.data();

        // Pre-fill fields from existing order
        setJobCardNo(data.jobCardNo || '');
        setJobName(data.jobName || '');
        setPaperSize(data.paperSize || '');

        // Material type from jobPaper
        setJobPaper(data.jobPaper || '');
        setPaperProductCode(data.paperProductCode || '');
        // Company name from customerName
        setCustomerName(data.customerName || '');

        // Required material - user can modify this
        setAdditionalPaperRequired(data.additionalPaperRequired || '');
        setJobLength(data.jobLength || ''); // ✅ Added
        setJobWidth(data.jobWidth || ''); // ✅ Added
        setJobQty(data.jobQty || ''); // ✅ Added
      } else {
        Alert.alert('Error', 'Order not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'Failed to fetch order details');
      setLoading(false);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [id, navigation]);

  const handleSubmit = async () => {
    if (loading) return; // prevent double tap
    setLoading(true);
    // Validation
    if (
      !jobCardNo ||
      !jobName ||
      !additionalPaperRequired ||
      !jobPaper ||
      !paperProductCode
    ) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      const materialRequestData = {
        orderId: id,
        jobCardNo,
        jobName,
        jobLength,
        jobWidth,
        paperSize,
        customerName,
        requiredMaterial: parseFloat(additionalPaperRequired),
        jobPaper,
        jobQty,
        paperProductCode,
        requestDate: firestore.Timestamp.fromDate(requestDate),
        remarks: remarks || '',
        requestStatus: 'Pending',
        createdAt: firestore.FieldValue.serverTimestamp(),
        createdBy: 'Punching',
      };

      // Add to materialRequest collection
      await firestore().collection('materialRequest').add(materialRequestData);

      // Optionally update the order's material request status
      await firestore().collection('ordersTest').doc(id).update({
        materialAllotStatus: 'Pending',
        jobPaper,
        lastMaterialRequestDate: firestore.FieldValue.serverTimestamp(),
      });

      Alert.alert('Success', 'Material request submitted successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Submit Error:', error);
      Alert.alert(
        'Error',
        'Failed to submit material request. Please try again.',
      );
    }
  };

  return (
    <View style={styles.adminFormMainContainer}>
      <Loader visible={loading} />

      <CustomHeader
        showHeadingSection1Container={true}
        showBackBtn
        showHeadingTextContainer={true}
        headingTitle="Material Request"
        showHeadingSection2Container
      />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.adminFormSubContainer}>
          {/* Job Card No - Read Only */}
          <CustomLabelTextInput
            label="Job Card No :"
            value={jobCardNo}
            editable={false}
          />

          {/* Job Name - Read Only */}
          <CustomLabelTextInput
            label="Job Name :"
            value={jobName}
            editable={false}
          />

          {/* Company Name - Read Only */}
          {/* <CustomLabelTextInput
            label="Customer Name :"
            value={customerName}
            editable={false}
          /> */}

          <JobOriginalSizeInput
            label="Job Original Size :"
            lengthValue={jobLength}
            widthValue={jobWidth}
            onLengthChange={setJobLength}
            onWidthChange={setJobWidth}
          />

          <CustomLabelTextInput
            label="Job Qty :"
            value={jobQty}
            onChangeText={setJobQty}
          />
          <CustomLabelTextInput
            label="Paper Size :"
            value={paperSize}
            onChangeText={setPaperSize}
          />

          {/* Material Type - Editable Dropdown */}
          <CustomDropdown
            placeholder={'Paper Product Code'}
            data={paperProductCodeData}
            style={styles.dropdownContainer}
            selectedText={styles.dropdownText}
            onSelect={item => setPaperProductCode(item)}
            showIcon={true}
            value={paperProductCode}
          />

          <CustomDropdown
            placeholder={'Material Type'}
            data={options}
            style={styles.dropdownContainer}
            selectedText={styles.dropdownText}
            onSelect={item => setJobPaper(item)}
            showIcon={true}
            value={jobPaper}
          />

          {/* Required Material - Editable */}
          <View style={styles.editableFieldContainer}>
            <CustomLabelTextInput
              label="Required Material :"
              value={additionalPaperRequired}
              onChangeText={setAdditionalPaperRequired}
              keyboardType="numeric"
            />
            {/* <Text style={styles.helperText}>
              You can modify this quantity as needed
            </Text> */}
          </View>

          {/* Request Date */}
          <View style={styles.inputBackContainer}>
            <Text style={styles.inputLabel}>Request Date:</Text>
            <TouchableOpacity
              onPress={() => setOpenRequestDate(true)}
              style={styles.inputContainer}>
              <Text style={styles.dateText}>{requestDate.toDateString()}</Text>
            </TouchableOpacity>
          </View>

          <DatePicker
            modal
            mode="date"
            open={openRequestDate}
            date={requestDate}
            onConfirm={date => {
              setOpenRequestDate(false);
              setRequestDate(date);
            }}
            onCancel={() => setOpenRequestDate(false)}
          />

          {/* Remarks - Optional */}
          <View style={styles.inputBackContainer}>
            <Text style={styles.inputLabel}>Remarks:</Text>
            <TextInput
              style={[styles.inputContainer, styles.remarksInput]}
              value={remarks}
              onChangeText={setRemarks}
              placeholder="Enter any additional notes (optional)"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.btnContainer}>
            <CustomButton
              title="Submit Request"
              style={styles.submitBtn}
              onPress={handleSubmit}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default MaterialRequestPunching;

const styles = StyleSheet.create({
  adminFormMainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  adminFormSubContainer: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Lato-Regular',
    color: '#000',
  },
  inputBackContainer: {
    width: '100%',
    backgroundColor: '#f6f6f6',
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    marginTop: 8,
  },
  dateText: {
    color: '#000',
    fontSize: 14,
    fontFamily: 'Lato-Regular',
  },
  remarksInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editableFieldContainer: {
    marginBottom: 5,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Lato-Regular',
    marginLeft: 5,
    marginTop: 5,
    fontStyle: 'italic',
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
  dropdownText: {
    fontSize: 14,
    fontFamily: 'Lato-Black',
    color: '#000',
    marginVertical: 10,
  },
});
