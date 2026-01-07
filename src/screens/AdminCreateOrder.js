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

const AdminCreateOrder = ({navigation}) => {
  const [poNo, setPoNo] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [jobCardNo, setJobCardNo] = useState('');
  const [jobName, setJobName] = useState('');
  const [jobDate, setJobDate] = useState(new Date());
  const [openJobDate, setOpenJobDate] = useState(false);
  const [jobLength, setJobLength] = useState('');
  const [jobWidth, setJobWidth] = useState('');
  const [paperSize, setPaperSize] = useState(''); // ✅ NEW FIELD
  const [jobQty, setJobQty] = useState('');
  const [jobPaper, setJobPaper] = useState('');
  const [plateSize, setPlateSize] = useState('');
  const [calculationSize, setCalculationSize] = useState('');
  const [upsAcrossValue, setUpsAcrossValue] = useState('');
  const [acrossGap, setAcrossGap] = useState('');
  const [aroundValue, setAroundValue] = useState('');
  const [aroundGap, setAroundGap] = useState('');
  const [totalPaperRequired, setTotalPaperRequired] = useState('');
  const [teethSizeValue, setTeethSizeValue] = useState('');
  const [blocksValue, setBlocksValue] = useState('');
  const [windingDirectionValue, setWindingDirectionValue] = useState('');
  const [selectedLabelType, setSelectedLabelType] = useState('');
  const [accept, setAccept] = useState(false);

  // Autocomplete states
  const [searchResults, setSearchResults] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);

  const route = useRoute();
  const {id, isEdit} = route.params || {};

  useEffect(() => {
    if (isEdit && id) {
      fetchOrderDetails();
    } else {
      generateJobCardNo();
    }
  }, [isEdit, id, fetchOrderDetails, generateJobCardNo]);

  const calculateTotalPaper = useCallback((qty, size, ups, around) => {
    const totalLabels = parseFloat(qty);
    const labelSize = parseFloat(size);
    const across = parseFloat(ups);
    const aroundValueNum = parseFloat(around);

    if (
      !isNaN(totalLabels) &&
      !isNaN(labelSize) &&
      !isNaN(across) &&
      !isNaN(aroundValueNum) &&
      aroundValueNum !== 0 // Prevent division by zero
    ) {
      const total =
        ((labelSize + parseFloat(aroundValueNum || 0)) * totalLabels) /
        (1000 * across);
      setTotalPaperRequired(total.toFixed(2));
    } else {
      setTotalPaperRequired('');
    }
  }, []);

  const fetchOrderDetails = useCallback(async () => {
    try {
      const doc = await firestore().collection('ordersTest').doc(id).get();
      if (doc.exists) {
        const data = doc.data();

        setPoNo(data.poNo || '');
        setCustomerName(data.customerName || '');
        setJobCardNo(data.jobCardNo || '');
        setJobName(data.jobName || '');
        setJobDate(data.jobDate ? data.jobDate.toDate() : new Date());
        setJobLength(data.jobLength || '');
        setJobWidth(data.jobWidth || '');
        setPaperSize(data.paperSize || '');
        setTotalPaperRequired(data.totalPaperRequired || '');
        setJobQty(data.jobQty || '');
        setAcrossGap(data.acrossGap || '');
        setAroundGap(data.aroundGap || '');
        setAccept(data.accept || false);
        setCalculationSize(data.calculationSize || '');

        // ✅ Extract ONLY the .value from objects
        setJobPaper(data.jobPaper?.value || '');
        setPlateSize(data.printingPlateSize?.value || '');
        setUpsAcrossValue(data.upsAcross?.value || '');
        setAroundValue(data.around?.value || '');
        setTeethSizeValue(data.teethSize?.value || '');
        setBlocksValue(data.blocks?.value || '');
        setWindingDirectionValue(data.windingDirection?.value || '');

        // Label Type is a simple string
        setSelectedLabelType(data.jobType || '');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  }, [id]);

  // Add this function in your AdminCreateOrder component
  const findOption = (list, value) => {
    return list.find(i => i.value === value) || {label: '', value: ''};
  };
  const generateJobCardNo = useCallback(async () => {
    try {
      const monthPrefix = moment().format('MMM');
      const yearSuffix = moment().format('YY');
      const prefix = `${monthPrefix}.${yearSuffix}`;

      const snapshot = await firestore()
        .collection('ordersTest')
        .where('jobCardNo', '>=', `${prefix}-`)
        .where('jobCardNo', '<=', `${prefix}-\uf8ff`)
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

  // ✅ FIX: Case-insensitive search - fetch all and filter
  const searchJobNames = async text => {
    try {
      const snapshot = await firestore().collection('ordersTest').get();

      const results = snapshot.docs
        .map(doc => ({id: doc.id, ...doc.data()}))
        .filter(
          doc =>
            doc.jobName &&
            doc.jobName.toLowerCase().includes(text.toLowerCase()),
        )
        .slice(0, 10);

      setSearchResults(results);
    } catch (error) {
      console.error('Error searching job names:', error);
    }
  };

  // ✅ FIX: Properly handle job selection
  const handleSelectJob = useCallback(item => {
    setSelectedJob(item);
    setJobName(item.jobName);
    setSearchResults([]);

    // Auto-fill other fields (except jobCardNo and jobDate)
    setPoNo(item.poNo || '');
    setCustomerName(item.customerName || '');
    setJobLength(item.jobLength || '');
    setJobWidth(item.jobWidth || '');
    setPaperSize(item.paperSize || '');
    setJobQty(item.jobQty || '');
    setCalculationSize(item.calculationSize || '');
    setTotalPaperRequired(item.totalPaperRequired || '');
    setAcrossGap(item.acrossGap || '');
    setAroundGap(item.aroundGap || '');
    setAccept(item.accept || false);

    // ✅ Extract ONLY the .value from objects (same as fetchOrderDetails)
    setJobPaper(item.jobPaper?.value || '');
    setPlateSize(item.printingPlateSize?.value || '');
    setUpsAcrossValue(item.upsAcross?.value || '');
    setAroundValue(item.around?.value || '');
    setTeethSizeValue(item.teethSize?.value || '');
    setBlocksValue(item.blocks?.value || '');
    setWindingDirectionValue(item.windingDirection?.value || '');
    setSelectedLabelType(item.jobType || '');
  }, []);

  const clearAutoFilledData = useCallback(() => {
    setPoNo('');
    setCustomerName('');
    setJobLength('');
    setJobWidth('');
    setPaperSize(''); // ✅ NEW FIELD
    setJobQty('');
    setCalculationSize('');
    setTotalPaperRequired('');
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
  }, []);

  // ✅ Validation function
  const validateForm = () => {
    if (!poNo.trim()) {
      Alert.alert('Validation Error', 'PO No is required');
      return false;
    }
    if (!jobName.trim()) {
      Alert.alert('Validation Error', 'Job Name is required');
      return false;
    }
    if (!jobCardNo.trim()) {
      Alert.alert('Validation Error', 'Job Card No is required');
      return false;
    }
    if (!customerName.trim()) {
      Alert.alert('Validation Error', 'Customer Name is required');
      return false;
    }
    if (!jobLength.trim()) {
      Alert.alert('Validation Error', 'Job Length is required');
      return false;
    }
    if (!jobWidth.trim()) {
      Alert.alert('Validation Error', 'Job Width is required');
      return false;
    }
    if (!paperSize.trim()) {
      Alert.alert('Validation Error', 'Paper Size is required');
      return false;
    }
    if (!jobQty.trim()) {
      Alert.alert('Validation Error', 'Job Quantity is required');
      return false;
    }
    if (!calculationSize.trim()) {
      Alert.alert('Validation Error', 'Label Size is required');
      return false;
    }
    if (!upsAcrossValue) {
      Alert.alert('Validation Error', 'Across Ups is required');
      return false;
    }
    if (!aroundValue.trim()) {
      Alert.alert('Validation Error', 'Around is required');
      return false;
    }
    if (!totalPaperRequired.trim()) {
      Alert.alert('Validation Error', 'Total Paper Required is required');
      return false;
    }
    if (!selectedLabelType.trim()) {
      Alert.alert('Validation Error', 'Label Type is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    // ✅ Validate form
    if (!validateForm()) {
      return;
    }

    try {
      const normalizedLabelType = selectedLabelType.trim().toLowerCase();
      let assignedUserUID;
      let jobStatus;

      if (normalizedLabelType === 'printing') {
        // assignedUserUID = 'uqTgURHeSvONdbFs154NfPYND1f2';
        assignedUserUID = 'fb0x3V2nmJScoe314je4lUHCySi2';

        jobStatus = 'Printing';
      } else if (normalizedLabelType === 'plain') {
        // assignedUserUID = 'Kt1bJQzaUPdAowP7bTpdNQEfXKO2';
        assignedUserUID = 'bOXXD73udtPRlOiVujoCChKL4bx2';

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
        jobLength,
        jobWidth,
        paperSize, // ✅ NEW FIELD
        jobQty,
        calculationSize,
        totalPaperRequired,
        jobType: selectedLabelType,
        assignedTo: assignedUserUID,
        // ✅ FIX: Check if already object or needs conversion
        jobPaper:
          typeof jobPaper === 'object'
            ? jobPaper
            : findOption(options, jobPaper),
        printingPlateSize:
          typeof plateSize === 'object'
            ? plateSize
            : findOption(printingPlateSize, plateSize),
        upsAcross:
          typeof upsAcrossValue === 'object'
            ? upsAcrossValue
            : findOption(upsAcross, upsAcrossValue),
        around:
          typeof aroundValue === 'object'
            ? aroundValue
            : findOption(around, aroundValue),
        teethSize:
          typeof teethSizeValue === 'object'
            ? teethSizeValue
            : findOption(teethSize, teethSizeValue),
        blocks:
          typeof blocksValue === 'object'
            ? blocksValue
            : findOption(blocks, blocksValue),
        windingDirection:
          typeof windingDirectionValue === 'object'
            ? windingDirectionValue
            : findOption(windingDirection, windingDirectionValue),

        accept,
        acrossGap,
        aroundGap,
        materialAllotStatus: 'Pending',
        materialAllocations: [],
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      // Material Request Data
      const materialRequestData = {
        jobCardNo,
        jobName,
        jobLength,
        jobWidth,
        paperSize, // ✅ NEW FIELD
        jobPaper:
          typeof jobPaper === 'object'
            ? jobPaper
            : findOption(options, jobPaper),
        jobQty,
        calculationSize,
        totalPaperRequired,
        requiredMaterial: totalPaperRequired,
        requestStatus: 'Pending',
        requestType: 'Initial',
        createdAt: firestore.FieldValue.serverTimestamp(),
        createdBy: 'Admin',
        customerName,
      };

      if (isEdit && id) {
        // Update existing order
        await firestore().collection('ordersTest').doc(id).update(orderData);

        // Update or create material request
        const materialRequestSnapshot = await firestore()
          .collection('materialRequest')
          .where('jobCardNo', '==', jobCardNo)
          .where('requestType', '==', 'Initial')
          .get();

        if (!materialRequestSnapshot.empty) {
          const materialDocId = materialRequestSnapshot.docs[0].id;
          await firestore()
            .collection('materialRequest')
            .doc(materialDocId)
            .update({
              ...materialRequestData,
              updatedAt: firestore.FieldValue.serverTimestamp(),
            });
        } else {
          await firestore()
            .collection('materialRequest')
            .add(materialRequestData);
        }

        Alert.alert('Success', 'Job updated successfully');
      } else {
        // Create new order
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

        const orderRef = await firestore()
          .collection('ordersTest')
          .add({
            ...orderData,
            jobStatus,
            createdAt: firestore.FieldValue.serverTimestamp(),
            createdBy: 'Admin',
          });

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
          {/* PO No * */}
          <View style={styles.inputBackContainer}>
            <Text style={styles.inputLabel}>PO No * :</Text>
            <TextInput
              style={styles.inputContainer}
              value={poNo}
              onChangeText={setPoNo}
            />
          </View>

          {/* Job Date */}
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
            minimumDate={new Date()}
            onConfirm={date => {
              setOpenJobDate(false);
              setJobDate(date);
            }}
            onCancel={() => setOpenJobDate(false)}
          />

          {/* Job Name * with Autocomplete */}
          <View style={{position: 'relative', marginTop: 5}}>
            <View style={[styles.inputBackContainer, {alignItems: 'center'}]}>
              <Text style={styles.inputLabel}>Job Name * :</Text>
              <View
                style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
                <TextInput
                  style={[styles.inputContainer, {flex: 1}]}
                  value={jobName}
                  onChangeText={text => {
                    setJobName(text);
                    setSelectedJob(null);
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

            {/* Autocomplete Dropdown */}
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

          {/* Job Card No * (readonly) */}
          <CustomLabelTextInput
            label="Job Card No * :"
            value={jobCardNo}
            editable={false}
          />

          {/* Customer Name * */}
          <CustomLabelTextInput
            label="Customer Name * :"
            value={customerName}
            onChangeText={setCustomerName}
          />

          {/* Job Original Size (Length x Width) * */}
          <JobOriginalSizeInput
            label="Job Original Size * :"
            lengthValue={jobLength}
            widthValue={jobWidth}
            onLengthChange={setJobLength}
            onWidthChange={setJobWidth}
          />

          {/* ✅ Paper Size * - NEW FIELD */}
          <CustomLabelTextInput
            label="Paper Size * :"
            value={paperSize}
            onChangeText={setPaperSize}
            keyboardType="numeric"
          />

          {/* Job Qty * */}
          <CustomLabelTextInput
            label="Job Qty * :"
            value={jobQty}
            keyboardType="numeric"
            onChangeText={value => {
              setJobQty(value);
              calculateTotalPaper(
                value,
                calculationSize,
                upsAcrossValue?.value || upsAcrossValue,
                aroundValue?.value || aroundValue,
              );
            }}
          />

          {/* Job Paper / Film Material */}
          <CustomDropdown
            placeholder={'Job Paper / Film Material'}
            data={options}
            style={styles.dropdownContainer}
            selectedText={styles.dropdownText}
            onSelect={item => setJobPaper(item)}
            showIcon={true}
            value={jobPaper}
          />

          {/* Printing Plate Size */}
          <CustomDropdown
            placeholder={'Printing Plate Size'}
            data={printingPlateSize}
            style={styles.dropdownContainer}
            selectedText={styles.dropdownText}
            onSelect={item => setPlateSize(item)}
            showIcon={true}
            value={plateSize}
          />

          {/* Label Size (Calculation) * */}
          <CustomLabelTextInput
            label="Label Size (Calculation) * :"
            value={calculationSize}
            keyboardType="numeric"
            onChangeText={value => {
              setCalculationSize(value);
              calculateTotalPaper(
                jobQty,
                value,
                upsAcrossValue?.value || upsAcrossValue,
                aroundValue?.value || aroundValue,
              );
            }}
          />

          {/* Across Ups * */}
          <CustomDropdown
            placeholder={'Across Ups *'}
            data={upsAcross}
            style={styles.dropdownContainer}
            selectedText={styles.dropdownText}
            onSelect={item => {
              setUpsAcrossValue(item);
              calculateTotalPaper(
                jobQty,
                calculationSize,
                item?.value || item,
                aroundValue?.value || aroundValue,
              );
            }}
            showIcon={true}
            value={upsAcrossValue}
          />

          {/* Across Gap */}
          <TextInput
            style={styles.enableDropdown}
            placeholder="Across Gap"
            placeholderTextColor="#000"
            keyboardType="numeric"
            onChangeText={setAcrossGap}
            value={acrossGap}
          />

          {/* Around */}
          <CustomDropdown
            placeholder={'Around *'}
            data={around}
            style={styles.dropdownContainer}
            selectedText={styles.dropdownText}
            // onSelect={item => setAroundValue(item)}
            onSelect={item => {
              setAroundValue(item);
              calculateTotalPaper(
                jobQty,
                calculationSize,
                upsAcrossValue?.value || upsAcrossValue,
                item?.value || item,
              );
            }}
            showIcon={true}
            value={aroundValue}
          />

          {/* Around Gap * */}
          <TextInput
            style={styles.enableDropdown}
            placeholder="Around Gap"
            placeholderTextColor="#000"
            keyboardType="numeric"
            onChangeText={setAroundGap}
            // onChangeText={value => {
            //   setAroundGap(value);
            //   calculateTotalPaper(
            //     jobQty,
            //     calculationSize,
            //     upsAcrossValue?.value || upsAcrossValue,
            //     value,
            //   );
            // }}
            value={aroundGap}
          />

          {/* Total Paper Required * (readonly) */}
          <CustomLabelTextInput
            label="Total Paper Required * :"
            value={totalPaperRequired}
            onChangeText={setTotalPaperRequired}
            editable={false}
            keyboardType="numeric"
          />

          {/* Teeth Size */}
          <CustomDropdown
            placeholder={'Teeth Size'}
            data={teethSize}
            style={styles.dropdownContainer}
            selectedText={styles.dropdownText}
            onSelect={item => setTeethSizeValue(item)}
            showIcon={true}
            value={teethSizeValue}
          />

          {/* Blocks */}
          <CustomDropdown
            placeholder={'Blocks'}
            data={blocks}
            style={styles.dropdownContainer}
            selectedText={styles.dropdownText}
            onSelect={item => setBlocksValue(item)}
            showIcon={true}
            value={blocksValue}
          />

          {/* Winding Direction */}
          <CustomDropdown
            placeholder={'Winding Direction'}
            data={windingDirection}
            style={styles.dropdownContainer}
            selectedText={styles.dropdownText}
            onSelect={item => setWindingDirectionValue(item)}
            showIcon={true}
            value={windingDirectionValue}
          />

          {/* Label Type * */}
          <CustomDropdown
            placeholder={'Label Type *'}
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
  dropdownText: {
    fontSize: 14,
    fontFamily: 'Lato-Black',
    color: '#000',
    marginVertical: 10,
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
});
