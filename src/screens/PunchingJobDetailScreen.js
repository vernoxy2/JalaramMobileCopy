import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Button,
  Alert,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import CustomHeader from '../components/CustomHeader';
import CustomDropdown from '../components/CustomDropdown';
import {paperProductCodeData} from '../constant/constant';
import {format} from 'date-fns';
import auth from '@react-native-firebase/auth';
import CustomTextInput from '../components/CustomTextInput';

const PunchingJobDetailsScreen = ({route, navigation}) => {
  const {order} = route.params;
  const isCompleted = order.punchingStatus === 'completed';
  const [extraPaperProducts, setExtraPaperProducts] = useState([]);
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

  const extraFields = {};
  extraPaperProducts.forEach((item, index) => {
    const num = index + 1;
    extraFields[`paperProductCode${num}`] = item.code;
    extraFields[`paperProductNo${num}`] = item.number;
  });

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

  // const handlePunchingStart = async () => {
  //   try {
  //     const currentUser = auth().currentUser;
  //     if (!currentUser) {
  //       Alert.alert('Error', 'User not authenticated');
  //       return;
  //     }

  //     const jobRef = firestore().collection('orders').doc(order.id);
  //     const extraFields = {};

  //     extraPaperProducts.forEach((item, index) => {
  //       const num = (paperProductCode.length > 0? paperProductCode.length : 0)+ (existingPaperProducts.length>0 ? existingPaperProducts.length:0) +index;
  //       extraFields[`paperProductCode${num}`] = item.code;
  //       extraFields[`paperProductNo${num}`] = item.number;
  //     });

  //     await jobRef.update({
  //       paperProductCode: paperProduct,
  //       paperProductNo: paperProductNo || order.paperProductNo || '',
  //       ...extraFields,
  //       runningMtr: runningMtrValue ? parseFloat(runningMtrValue) : null,
  //       startByPunching: currentUser.uid,
  //       punchingStartAt: firestore.FieldValue.serverTimestamp(),
  //       isPunchingStart: true,
  //       punchingStatus: 'started',
  //       jobStatus: 'Punching', // ✅ make sure it's still Punching
  //     });
  //     setIsPunchingStart(true);
  //     Alert.alert('Success', 'Punching started');
  //     navigation.navigate('PunchingHomeScreen');

  //     // navigation.goBack();
  //   } catch (error) {
  //     console.error('Error punching start:', error);
  //     Alert.alert('Error', 'Failed to start punching');
  //   }
  // };


  const handlePunchingStart = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // ✋ 1. VALIDATION — stop if any extra row is empty
      const hasEmptyRow = extraPaperProducts.some(
        item => item.code === '' || item.number === '',
      );

      if (hasEmptyRow) {
        Alert.alert(
          'Incomplete Entry',
          'Please fill all extra Paper Product fields or remove empty rows.',
        );
        return;
      }

      const jobRef = firestore().collection('orders').doc(order.id);

      // 2. FIND LAST EXISTING INDEX
      let maxIndex = 0;
      Object.keys(order).forEach(key => {
        const match = key.match(/^paperProductCode(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxIndex) maxIndex = num;
        }
      });

      // 3. CREATE EXTRA FIELDS ONLY FOR FILLED ROWS
      const extraFields = {};
      extraPaperProducts.forEach((item, idx) => {
        const newIndex = maxIndex + idx + 1;

        extraFields[`paperProductCode${newIndex}`] = item.code;
        extraFields[`paperProductNo${newIndex}`] = item.number;
      });

      // 4. UPDATE FIRESTORE
      await jobRef.update({
        paperProductCode: paperProduct,
        paperProductNo: paperProductNo || order.paperProductNo || '',
        ...extraFields,
        runningMtr: runningMtrValue ? parseFloat(runningMtrValue) : null,
        startByPunching: currentUser.uid,
        punchingStartAt: firestore.FieldValue.serverTimestamp(),
        isPunchingStart: true,
        punchingStatus: 'started',
        jobStatus: 'Punching',
      });

      setIsPunchingStart(true);
      Alert.alert('Success', 'Punching started');
      navigation.navigate('PunchingHomeScreen');
    } catch (error) {
      console.error('Error punching start:', error);
      Alert.alert('Error', 'Failed to start punching');
    }
  };

  // const getExistingPaperProducts = (order) => {
  //   const result = [];

  //   // 🔥 Handle the MAIN pair (no index)
  //   if (order.paperProductCode || order.paperProductNo) {
  //     result.push({
  //       code: order.paperProductCode?.value || order.paperProductCode || '',
  //       number: order.paperProductNo || '',
  //       index: 0, // index 0 = main
  //     });
  //   }

  //   // 🔥 Handle dynamic extra pairs 1 → 10
  //   for (let i = 1; i <= 10; i++) {
  //     const codeKey = `paperProductCode${i}`;
  //     const noKey = `paperProductNo${i}`;

  //     if (order[codeKey] || order[noKey]) {
  //       result.push({
  //         code: order[codeKey]?.value || order[codeKey] || '',
  //         number: order[noKey] || '',
  //         index: i,
  //       });
  //     }
  //   }

  //   return result;
  // };

  const getExistingPaperProducts = order => {
    const result = [];

    // 🚫 ❌ DO NOT include MAIN "paperProductCode" here
    // the main code + number is already displayed separately

    // ✔ Include ONLY dynamic fields
    for (let i = 1; i <= 50; i++) {
      const codeKey = `paperProductCode${i}`;
      const noKey = `paperProductNo${i}`;

      if (order[codeKey] || order[noKey]) {
        result.push({
          code: order[codeKey]?.value || order[codeKey] || '',
          number: order[noKey] || '',
          index: i,
        });
      }
    }

    return result;
  };

  const removeExtraPaperProduct = id => {
    setExtraPaperProducts(prev => prev.filter(p => p.id !== id));
  };

  const updateExtraPaperProduct = (id, field, value) => {
    setExtraPaperProducts(prev =>
      prev.map(item => (item.id === id ? {...item, [field]: value} : item)),
    );
  };
  const addExtraPaperProduct = () => {
    if (extraPaperProducts.length >= 10) {
      Alert.alert('Limit Reached', 'You can add only up to 10 extra products');
      return;
    }

    const lastExistingIndex =
      existingPaperProducts.length > 0
        ? existingPaperProducts[existingPaperProducts.length - 1].index
        : 0;

    const lastExtraIndex =
      extraPaperProducts.length > 0
        ? extraPaperProducts[extraPaperProducts.length - 1].index
        : lastExistingIndex;

    const nextIndex = lastExtraIndex + 1;

    setExtraPaperProducts(prev => [
      ...prev,
      {
        id: Date.now(),
        index: nextIndex, // ⭐ store actual index here
        code: '',
        number: '',
      },
    ]);
  };

  const existingPaperProducts = getExistingPaperProducts(order);

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
            {/* {order.paperProductCode ? (
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
            )} */}

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
                data={paperProductCodeData}
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

            {/* SHOW EXISTING EXTRA PAPER PRODUCT PAIRS HERE */}
            {existingPaperProducts.length > 0 && (
              <View>
                {/* <Text style={[styles.label, {fontWeight: 'bold' }]}>
                  Additional Paper Products:
                </Text> */}

                {existingPaperProducts.map((item, index) => (
                  <View key={index} style={{marginVertical: 8}}>
                    <Text style={styles.label}>Paper Product Code:</Text>
                    <Text style={styles.value}>
                      {typeof item.code === 'object'
                        ? item.code.label
                        : item.code}
                    </Text>

                    <Text style={styles.label}>Paper Product No:</Text>
                    <Text style={styles.value}>{item.number}</Text>
                  </View>
                ))}
              </View>
            )}
            {/* ============================================= */}

            {extraPaperProducts.map((item, index) => (
              <View key={item.id}>
                <CustomDropdown
                  placeholder={`Paper Product Code`}
                  data={paperProductCodeData}
                  style={styles.dropdownContainer}
                  selectedText={styles.dropdownText}
                  onSelect={val =>
                    updateExtraPaperProduct(item.id, 'code', val)
                  }
                  showIcon={true}
                />

                <CustomTextInput
                  placeholder={`Paper Product No`}
                  value={item.number}
                  onChangeText={text =>
                    updateExtraPaperProduct(item.id, 'number', text)
                  }
                  style={{width: '100%'}}
                />
                {/* REMOVE button */}
                <TouchableOpacity
                  onPress={() => removeExtraPaperProduct(item.id)}
                  style={{marginTop: 6, alignSelf: 'flex-end'}}>
                  <Text style={{color: 'red'}}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={{marginVertical: 10}}
              onPress={addExtraPaperProduct}>
              <Text style={{color: '#3668B1', fontSize: 16}}>
                + Add Paper Product
              </Text>
            </TouchableOpacity>
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
