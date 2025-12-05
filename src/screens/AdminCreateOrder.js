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
import moment from 'moment';
import {useRoute} from '@react-navigation/native';
import JobOriginalSizeInput from '../components/JobOriginalSizeInput ';
import {set} from 'date-fns';

const AdminCreateOrder = ({navigation}) => {
  const [poNo, setPoNo] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [jobCardNo, setJobCardNo] = useState('');
  const [jobName, setJobName] = useState('');
  const [jobDate, setJobDate] = useState(new Date());
  const [openJobDate, setOpenJobDate] = useState(false);
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
  const [accept, setAccept] = useState(false);
  const [jobType, setJobType] = useState('');
  const [acrossGap, setAcrossGap] = useState('');
  const [aroundGap, setAroundGap] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobLength, setJobLength] = useState('');
  const [jobWidth, setJobWidth] = useState('');
  const [totalPaperRequired, setTotalPaperRequired] = useState('');

  const route = useRoute();
  const {id, isEdit} = route.params || {};

  // const printingColors = [];
  // if (checkboxState.box1) printingColors.push('Uv');
  // if (checkboxState.box2) printingColors.push('Water');
  // if (checkboxState.box3) printingColors.push('Special');

  const handleCheckboxChange = box => {
    setCheckboxState(prevState => ({
      ...prevState,
      [box]: !prevState[box],
    }));
  };

  useEffect(() => {
    if (isEdit && id) {
      fetchOrderDetails();
    } else {
      generateJobCardNo();
    }
  }, [isEdit, id, fetchOrderDetails, generateJobCardNo]);

  useEffect(() => {
    if (jobLength && jobWidth && jobQty) {
      const length = parseFloat(jobLength);
      const width = parseFloat(jobWidth);
      const qty = parseInt(jobQty, 10);

      // Check if all values are valid numbers
      if (!isNaN(length) && !isNaN(width) && !isNaN(qty)) {
        const total = length * width * qty;
        setTotalPaperRequired(total.toFixed(2)); // Format to 2 decimal places
      } else {
        setTotalPaperRequired('');
      }
    } else {
      setTotalPaperRequired('');
    }
  }, [jobLength, jobWidth, jobQty]);

  const fetchOrderDetails = useCallback(async () => {
    try {
      const doc = await firestore().collection('ordersTest').doc(id).get();
      if (doc.exists) {
        const data = doc.data();
        // ✅ Text Inputs
        setPoNo(data.poNo || '');
        setCustomerName(data.customerName || '');
        setJobCardNo(data.jobCardNo || '');
        setJobName(data.jobName || '');
        setJobDate(data.jobDate?.toDate() || new Date());
        setJobSize(data.jobSize || '');
        setJobQty(data.jobQty || '');
        setAcrossGap(data.acrossGap || '');
        setAroundGap(data.aroundGap || '');
        setAccept(data.accept || false);
        setJobLength(data.jobLength || ''); // ✅ Added
        setJobWidth(data.jobWidth || ''); // ✅ Added
        setTotalPaperRequired(data.totalPaperRequired || ''); // ✅ Added

        // ✅ Dropdowns
        setJobPaper(data.jobPaper || '');
        setPlateSize(data.printingPlateSize || '');
        setUpsAcrossValue(data.upsAcross || '');
        setAroundValue(data.around || '');
        setTeethSizeValue(data.teethSize || '');
        setBlocksValue(data.blocks || '');
        setWindingDirectionValue(data.windingDirection || '');
        setSelectedLabelType(data.jobType || '');

        // ✅ Checkbox logic for printing colors
        setCheckboxState({
          box1: data.printingColors?.includes('Uv') || false,
          box2: data.printingColors?.includes('Water') || false,
          box3: data.printingColors?.includes('Special') || false,
        });
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  }, [id]); // depends only on id

  const generateJobCardNo = useCallback(async () => {
    try {
      const monthPrefix = moment().format('MMM'); // e.g. Nov
      const yearSuffix = moment().format('YY'); // e.g. 25
      const prefix = `${monthPrefix}.${yearSuffix}`; // e.g. Nov.25

      const snapshot = await firestore()
        .collection('ordersTest')
        .where('jobCardNo', '>=', `${prefix}-`)
        .where('jobCardNo', '<=', `${prefix}-\uf8ff`) // ensures prefix match
        .get();

      let maxNumber = 0;

      snapshot.forEach(doc => {
        const jobCardNo = doc.data().jobCardNo;
        if (jobCardNo && jobCardNo.startsWith(prefix)) {
          const parts = jobCardNo.split('-');
          if (parts.length === 2 && !isNaN(parts[1])) {
            const num = parseInt(parts[1], 10);
            if (num > maxNumber) {
              maxNumber = num;
            }
          }
        }
      });

      const nextNumber = maxNumber + 1;
      const newJobNo = `${prefix}-${String(nextNumber).padStart(2, '0')}`;
      setJobCardNo(newJobNo);
    } catch (err) {
      console.error('Error generating job card number:', err);
    }
  }, []);

  const handleSubmit = async () => {
    try {
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

      const orderData = {
        poNo,
        jobDate: firestore.Timestamp.fromDate(jobDate),
        customerName,
        jobCardNo,
        jobName,
        jobSize,
        jobQty,
        jobLength, // ✅ Added
        jobWidth, // ✅ Added
        totalPaperRequired, // ✅ Added
        jobType: selectedLabelType,
        assignedTo: assignedUserUID,
        jobPaper,
        printingPlateSize: plateSize,
        upsAcross: upsAcrossValue,
        around: aroundValue,
        teethSize: teethSizeValue,
        blocks: blocksValue,
        windingDirection: windingDirectionValue,
        accept,
        acrossGap,
        aroundGap,
        materialAllotStatus: 'Pending', // ✅ Added default status
        materialAllocations: [],
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      // ✅ Material Request Data
      const materialRequestData = {
        jobCardNo,
        jobName,
        jobLength,
        jobWidth,
        jobPaper,
        jobQty,
        totalPaperRequired,
        requestStatus: 'Pending', // Default status for material request
        requestType: 'Initial',
        createdAt: firestore.FieldValue.serverTimestamp(),
        createdBy: 'Admin',
      };

      if (isEdit && id) {
        // ✅ Update existing order (keep old jobStatus)
        await firestore().collection('ordersTest').doc(id).update(orderData);

        // ✅ Update materialRequest if it exists, or create new one
        const materialRequestSnapshot = await firestore()
          .collection('materialRequest')
          .where('jobCardNo', '==', jobCardNo)
          .where('requestType', '==', 'Initial')
          .get();

        if (!materialRequestSnapshot.empty) {
          // Update existing material request
          const docId = materialRequestSnapshot.docs[0].id;
          await firestore()
            .collection('materialRequest')
            .doc(docId)
            .update({
              ...materialRequestData,
              updatedAt: firestore.FieldValue.serverTimestamp(),
            });
        } else {
          // Create new material request if doesn't exist
          await firestore()
            .collection('materialRequest')
            .add(materialRequestData);
        }

        Alert.alert('Success', 'Job updated successfully');
      } else {
        // ✅ Create new order
        const exists = await firestore()
          .collection('ordersTest')
          .where('jobCardNo', '==', jobCardNo)
          .get();

        if (!exists.empty) {
          Alert.alert(
            'Duplicate Job Card No',
            'Please generate another number',
          );
          return;
        }

        // ✅ Add to orders collection
        // await firestore()
        //   .collection('orders')
        //   .add({
        //     ...orderData,
        //     jobStatus,
        //     createdAt: firestore.FieldValue.serverTimestamp(),
        //     createdBy: 'Admin',
        //   });

        // await firestore()
        //   .collection('materialRequest')
        //   .add(materialRequestData);

        const orderRef = await firestore()
          .collection('ordersTest')
          .add({
            ...orderData,
            jobStatus,
            createdAt: firestore.FieldValue.serverTimestamp(),
            createdBy: 'Admin',
          });

        // Add material request with orderId
        await firestore()
          .collection('materialRequest')
          .add({
            ...materialRequestData,
            orderId: orderRef.id,
          });
        Alert.alert('Success', 'Job created successfully');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Submit Error:', error);
      Alert.alert('Error', 'Something went wrong. Try again.');
    }
  };

  const searchJobNames = async text => {
    try {
      const snapshot = await firestore()
        .collection('ordersTest')
        .where('jobName', '>=', text[0].toUpperCase())
        .where('jobName', '<=', text[0].toUpperCase() + '\uf8ff')
        .limit(10)
        .get();

      const results = snapshot.docs
        .map(doc => ({id: doc.id, ...doc.data()}))
        .filter(doc => doc.jobName.toLowerCase().includes(text.toLowerCase()));

      setSearchResults(results);
    } catch (error) {
      console.error('Error searching job names:', error);
    }
  };

  const handleSelectJob = item => {
    setSelectedJob(item);
    setJobName(item.jobName);
    setSearchResults([]);

    // Auto-fill other fields (except jobCardNo)
    setPoNo(item.poNo || '');
    setCustomerName(item.customerName || '');
    setJobSize(item.jobSize || '');
    setJobQty(item.jobQty || '');
    setAcrossGap(item.acrossGap || '');
    setAroundGap(item.aroundGap || '');
    setJobPaper(item.jobPaper || '');
    setPlateSize(item.printingPlateSize || '');
    setUpsAcrossValue(item.upsAcross || '');
    setAroundValue(item.around || '');
    setTeethSizeValue(item.teethSize || '');
    setBlocksValue(item.blocks || '');
    setWindingDirectionValue(item.windingDirection || '');
    setSelectedLabelType(item.jobType || '');
    setAccept(item.accept || false);

    setCheckboxState({
      box1: item.printingColors?.includes('Uv') || false,
      box2: item.printingColors?.includes('Water') || false,
      box3: item.printingColors?.includes('Special') || false,
    });
  };
  const clearAutoFilledData = () => {
    setCustomerName('');
    setJobSize('');
    setJobQty('');
    setAcrossGap('');
    setAroundGap('');
    setJobPaper('');
    setPlateSize('');
    setUpsAcrossValue('');
    setAroundValue('');
    setTeethSizeValue('');
    setBlocksValue('');
    setWindingDirectionValue('');
    setSelectedLabelType('');
    setCheckboxState({box1: false, box2: false, box3: false});
    setPoNo('');
  };

  return (
    <View style={styles.adminFormMainContainer}>
      <CustomHeader
        showHeadingSection1Container={true}
        showBackBtn
        showHeadingTextContainer={true}
        headingTitle={isEdit ? 'Edit Job Card' : 'Flexo Job Card'}
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
          {/* Job Name */}
          <View style={{position: 'relative', marginTop: 5}}>
            <View style={[styles.inputBackContainer, {alignItems: 'center'}]}>
              <Text style={styles.inputLabel}>Job Name :</Text>
              <View
                style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
                <TextInput
                  style={[styles.inputContainer, {flex: 1}]}
                  value={jobName}
                  onChangeText={text => {
                    setJobName(text);
                    setSelectedJob(null); // clear previous selection
                    if (text.length >= 2) {
                      searchJobNames(text);
                    } else {
                      setSearchResults([]);
                    }
                  }}
                  placeholder="Enter job name"
                />
                {selectedJob && (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedJob(null);
                      setJobName('');
                      setSearchResults([]);
                      clearAutoFilledData();
                    }}
                    style={{marginLeft: 5}}>
                    <Text style={{fontSize: 18, color: 'red'}}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Dropdown list for matching job names */}
            {searchResults.length > 0 && !selectedJob && (
              <View style={styles.dropdownSuggestionContainer}>
                {searchResults.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleSelectJob(item)}
                    style={styles.dropdownSuggestionItem}>
                    <Text style={styles.dropdownSuggestionText}>
                      {item.jobName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <CustomLabelTextInput
            label="Job Card No :"
            value={jobCardNo}
            // onChangeText={setJobCardNo}
            // keyboardType="number-pad"
            editable={false}
          />
          <CustomLabelTextInput
            label="Customer Name :"
            value={customerName}
            onChangeText={setCustomerName}
          />

          {/* <CustomLabelTextInput
            label="Job Original Size :"
            value={jobSize}
            onChangeText={setJobSize}
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
            label="Total Paper Required :"
            value={totalPaperRequired}
            onChangeText={setTotalPaperRequired}
            // editable={false}
          />

          <CustomDropdown
            placeholder={'Job Paper / Film Material'}
            data={options}
            style={styles.dropdownContainer}
            selectedText={styles.dropdownText}
            onSelect={item => setJobPaper(item)}
            showIcon={true}
            value={jobPaper}
          />
          <CustomDropdown
            placeholder={'Printing Plate Size'}
            data={printingPlateSize}
            style={styles.dropdownContainer}
            selectedText={styles.dropdownText}
            onSelect={item => setPlateSize(item)}
            showIcon={true}
            value={plateSize}
          />
          <CustomDropdown
            placeholder={'Across Ups'}
            data={upsAcross}
            style={styles.dropdownContainer}
            selectedText={styles.dropdownText}
            onSelect={item => setUpsAcrossValue(item)}
            showIcon={true}
            value={upsAcrossValue}
          />

          <TextInput
            style={styles.enableDropdown}
            placeholder="Across Gap"
            placeholderTextColor="#000"
            keyboardType="numeric"
            onChangeText={setAcrossGap}
            value={acrossGap}
          />
          <CustomDropdown
            placeholder={'Around'}
            data={around}
            style={styles.dropdownContainer}
            selectedText={styles.dropdownText}
            onSelect={item => setAroundValue(item)}
            showIcon={true}
            value={aroundValue}
          />
          <TextInput
            style={styles.enableDropdown}
            placeholder="Around Gap"
            placeholderTextColor="#000"
            keyboardType="numeric"
            onChangeText={setAroundGap}
            value={aroundGap}
          />
          <CustomDropdown
            placeholder={'Teeth Size'}
            data={teethSize}
            style={styles.dropdownContainer}
            selectedText={styles.dropdownText}
            onSelect={item => setTeethSizeValue(item)}
            showIcon={true}
            value={teethSizeValue}
          />
          <CustomDropdown
            placeholder={'Blocks'}
            data={blocks}
            style={styles.dropdownContainer}
            selectedText={styles.dropdownText}
            onSelect={item => setBlocksValue(item)}
            showIcon={true}
            value={blocksValue}
          />
          <CustomDropdown
            placeholder={'Winding Direction'}
            data={windingDirection}
            style={styles.dropdownContainer}
            selectedText={styles.dropdownText}
            onSelect={item => setWindingDirectionValue(item)}
            showIcon={true}
            value={windingDirectionValue}
          />

          <CustomDropdown
            placeholder={'Label Type'}
            data={labelType}
            style={styles.dropdownContainer}
            selectedText={styles.dropdownText}
            showIcon={true}
            onSelect={item => setSelectedLabelType(item.value)}
            value={selectedLabelType}
          />

          <View style={styles.btnContainer}>
            <CustomButton
              title={isEdit ? 'Update' : 'Submit'}
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
  enableDropdown: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    height: 40,
    width: '100%',
    marginTop: 20,
    fontSize: 14,
    color: '#000',
    fontFamily: 'Lato-Black',
  },
  dropdownSuggestionContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    zIndex: 10,
    elevation: 5,
  },
  dropdownSuggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownSuggestionText: {
    fontSize: 14,
    color: '#000',
  },
  customLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },

  sizeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
  },

  sizeInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingVertical: 5,
    fontSize: 14,
    color: '#000',
    marginHorizontal: 90,
  },

  multiplySign: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 5,
    color: '#000',
  },
  completionFieldsContainer: {
    marginTop: 15,
    marginBottom: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});
