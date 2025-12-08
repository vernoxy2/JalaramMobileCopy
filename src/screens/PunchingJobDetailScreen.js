import React, {useState, useEffect} from 'react';
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
  const order = React.useMemo(
    () => route?.params?.order || {},
    [route?.params?.order],
  );

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

  // NEW: Material usage data for each paper product
  const [paperProductsList, setPaperProductsList] = useState([]);
  const [materialUsageData, setMaterialUsageData] = useState([]);

  // Load paper products and material usage data from order
  useEffect(() => {
    if (!order) return;

    // Extract all paper products from order
    const papers = [];

    // Add main paper product
    if (order.paperProductCode && order.paperProductNo) {
      papers.push({
        code: order.paperProductCode,
        number: order.paperProductNo,
        index: 0,
      });
    }

    // Add extra paper products (paperProductCode1-10, paperProductNo1-10)
    for (let i = 1; i <= 10; i++) {
      const codeKey = `paperProductCode${i}`;
      const numberKey = `paperProductNo${i}`;

      if (order[codeKey] && order[numberKey]) {
        papers.push({
          code: order[codeKey],
          number: order[numberKey],
          index: i,
        });
      }
    }

    setPaperProductsList(papers);

    // Initialize material usage data for each paper product
    const initialUsageData = papers.map((paper, index) => {
      // Find existing tracking data for this paper product
      const existingData =
        order.materialUsageTracking?.find(
          item => item.paperProductNo === paper.number,
        ) || {};

      return {
        paperProductCode: paper.code,
        paperProductNo: paper.number,
        printing: existingData.printing || null, // Already completed
        punching: {
          used: existingData.punching?.used?.toString() || '',
          waste: existingData.punching?.waste?.toString() || '',
          leftover: existingData.punching?.leftover?.toString() || '',
          wip: existingData.punching?.wip?.toString() || '',
        },
        slitting: existingData.slitting || null, // Will be filled later
      };
    });

    setMaterialUsageData(initialUsageData);
  }, [order]);

  // Update material usage for specific paper product
  const updateMaterialUsage = (index, field, value) => {
    setMaterialUsageData(prev =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              punching: {
                ...item.punching,
                [field]: value,
              },
            }
          : item,
      ),
    );
  };

  const extraFields = {};
  extraPaperProducts.forEach((item, index) => {
    const num = index + 1;
    extraFields[`paperProductCode${num}`] = item.code;
    extraFields[`paperProductNo${num}`] = item.number;
  });

  // const handlePunchingComplete = async () => {
  //   try {
  //     const currentUser = auth().currentUser;
  //     if (!currentUser) {
  //       Alert.alert('Error', 'User not authenticated');
  //       return;
  //     }

  //     // Validate that all material usage fields are filled
  //     const hasEmptyFields = materialUsageData.some(
  //       item =>
  //         !item.punching.used ||
  //         !item.punching.waste ||
  //         !item.punching.leftover ||
  //         !item.punching.wip,
  //     );

  //     if (hasEmptyFields) {
  //       Alert.alert(
  //         'Missing Data',
  //         'Please fill all material usage fields for each paper product',
  //       );
  //       return;
  //     }

  //     const jobRef = firestore().collection('ordersTest').doc(order.id);

  //     // Update materialUsageTracking array with punching data
  //     const updatedMaterialTracking = materialUsageData.map(item => {
  //       const codeValue = item.paperProductCode?.label || item.paperProductCode;

  //       return {
  //         paperProductCode: codeValue,
  //         paperProductNo: item.paperProductNo,
  //         printing: item.printing, // Keep existing printing data
  //         punching: {
  //           used: parseFloat(item.punching.used) || 0,
  //           waste: parseFloat(item.punching.waste) || 0,
  //           leftover: parseFloat(item.punching.leftover) || 0,
  //           wip: parseFloat(item.punching.wip) || 0,
  //           completedAt: new Date(),
  //           completedBy: currentUser.uid,
  //         },
  //         slitting: null, // Will be filled in slitting phase
  //       };
  //     });

  //     await jobRef.update({
  //       jobStatus: 'Slitting',
  //       punchingStatus: 'completed',
  //       paperCode: paperCodeValue || '',
  //       updatedByPunchingAt: firestore.FieldValue.serverTimestamp(),
  //       assignedTo: 'sDdHMFBdkrhF90pwSk0g1ALcct33',
  //       completedByPunching: currentUser.uid,
  //       materialUsageTracking: updatedMaterialTracking,
  //       ...extraFields,
  //     });

  //     Alert.alert('Success', 'Punching marked as completed');
  //     navigation.goBack();
  //   } catch (error) {
  //     console.error('Error completing punching:', error);
  //     console.error('Error message:', error.message);
  //     console.error('Error code:', error.code);
  //     Alert.alert('Error', 'Failed to complete punching');
  //   }
  // };

  const handlePunchingComplete = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // Validate that all material usage fields are filled
      const hasEmptyFields = materialUsageData.some(
        item =>
          !item.punching.used ||
          !item.punching.waste ||
          !item.punching.leftover ||
          !item.punching.wip,
      );

      if (hasEmptyFields) {
        Alert.alert(
          'Missing Data',
          'Please fill all material usage fields for each paper product',
        );
        return;
      }

      const jobRef = firestore().collection('ordersTest').doc(order.id);

      // ========================================================
      // ✅ CREATE LO AND WIP MATERIALS + TRANSACTIONS
      // ========================================================

      const updatedMaterialTracking = [];

      for (const item of materialUsageData) {
        const codeValue = item.paperProductCode?.label || item.paperProductCode;
        const paperProductNo = item.paperProductNo;

        const usedQty = parseFloat(item.punching.used) || 0;
        const wasteQty = parseFloat(item.punching.waste) || 0;
        const loQty = parseFloat(item.punching.leftover) || 0;
        const wipQty = parseFloat(item.punching.wip) || 0;

        // ✅ STEP 1: Create LO Material (if leftover > 0)
        let loMaterialId = null;
        let loPaperCode = null;

        if (loQty > 0) {
          loPaperCode = `LO-${order.jobCardNo}-PU`;

          const loMaterialData = {
            paperCode: loPaperCode,
            paperProductCode: codeValue,
            jobPaper: order.jobPaper?.value || order.jobPaper,
            paperSize: order.paperSize || 0,
            runningMeter: loQty,
            roll: 1,
            totalRunningMeter: loQty,
            availableRunningMeter: loQty,
            materialCategory: 'LO',
            isActive: true,

            // Source tracking
            sourceJobCardNo: order.jobCardNo,
            sourcePaperCode: codeValue,
            sourceStage: 'punching',

            date: new Date(),
            createdAt: firestore.FieldValue.serverTimestamp(),
            updatedAt: firestore.FieldValue.serverTimestamp(),
            createdBy: currentUser.uid,
          };

          const loRef = await firestore()
            .collection('materials')
            .add(loMaterialData);
          loMaterialId = loRef.id;

          console.log('✅ LO Material Created:', loPaperCode, loMaterialId);
        }

        // ✅ STEP 2: Create WIP Material (if wip > 0)
        let wipMaterialId = null;
        let wipPaperCode = null;

        if (wipQty > 0) {
          wipPaperCode = `WIP-${order.jobCardNo}-PU`;

          const wipMaterialData = {
            paperCode: wipPaperCode,
            paperProductCode: codeValue,
            jobPaper: order.jobPaper?.value || order.jobPaper,
            paperSize: order.paperSize || 0,
            runningMeter: wipQty,
            roll: 1,
            totalRunningMeter: wipQty,
            availableRunningMeter: wipQty,
            materialCategory: 'WIP',
            isActive: true,

            // Source tracking
            sourceJobCardNo: order.jobCardNo,
            sourcePaperCode: codeValue,
            sourceStage: 'punching',

            date: new Date(),
            createdAt: firestore.FieldValue.serverTimestamp(),
            updatedAt: firestore.FieldValue.serverTimestamp(),
            createdBy: currentUser.uid,
          };

          const wipRef = await firestore()
            .collection('materials')
            .add(wipMaterialData);
          wipMaterialId = wipRef.id;

          console.log('✅ WIP Material Created:', wipPaperCode, wipMaterialId);
        }

        // ✅ STEP 3: Create Transaction Record
        const newPaperCodes = [];
        if (loPaperCode) newPaperCodes.push(loPaperCode);
        if (wipPaperCode) newPaperCodes.push(wipPaperCode);

        const transactionData = {
          transactionType: 'consumption',
          transactionDate: firestore.FieldValue.serverTimestamp(),
          jobCardNo: order.jobCardNo,
          orderRef: order.id,
          stage: 'punching',

          // Material details
          paperCode: codeValue,
          paperProductCode: codeValue,
          paperProductNo: paperProductNo,
          materialCategory: 'WIP', // Assuming WIP from printing was consumed

          // Quantities
          usedQty: usedQty,
          wasteQty: wasteQty,
          loQty: loQty,
          wipQty: wipQty,

          // New materials created
          newPaperCode: newPaperCodes.join(', ') || null,
          loMaterialId: loMaterialId,
          wipMaterialId: wipMaterialId,

          createdBy: currentUser.uid,
          remarks: `Punching stage completed for job ${order.jobCardNo}`,
        };

        await firestore()
          .collection('materialTransactions')
          .add(transactionData);

        console.log('✅ Transaction Created for:', codeValue);

        // ✅ STEP 4: Add to updatedMaterialTracking (keep existing structure)
        updatedMaterialTracking.push({
          paperProductCode: codeValue,
          paperProductNo: paperProductNo,
          printing: item.printing, // Keep existing printing data
          punching: {
            used: usedQty,
            waste: wasteQty,
            leftover: loQty,
            wip: wipQty,
            completedAt: new Date(),
            completedBy: currentUser.uid,
          },
          slitting: null, // Will be filled in slitting phase
        });
      }

      // ========================================================
      // ✅ UPDATE ORDER DOCUMENT
      // ========================================================

      await jobRef.update({
        jobStatus: 'Slitting',
        punchingStatus: 'completed',
        paperCode: paperCodeValue || '',
        updatedByPunchingAt: firestore.FieldValue.serverTimestamp(),
        assignedTo: 'sDdHMFBdkrhF90pwSk0g1ALcct33',
        completedByPunching: currentUser.uid,
        materialUsageTracking: updatedMaterialTracking,
        ...extraFields,
      });

      Alert.alert(
        'Success',
        'Punching completed! LO and WIP materials created.',
      );
      navigation.goBack();
    } catch (error) {
      console.error('Error completing punching:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      Alert.alert('Error', `Failed to complete punching: ${error.message}`);
    }
  };
  const handlePunchingStart = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

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

      const jobRef = firestore().collection('ordersTest').doc(order.id);

      let maxIndex = 0;
      Object.keys(order).forEach(key => {
        const match = key.match(/^paperProductCode(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxIndex) maxIndex = num;
        }
      });

      const extraFields = {};
      extraPaperProducts.forEach((item, idx) => {
        const newIndex = maxIndex + idx + 1;
        extraFields[`paperProductCode${newIndex}`] = item.code;
        extraFields[`paperProductNo${newIndex}`] = item.number;
      });

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
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      Alert.alert('Error', 'Failed to start punching');
    }
  };

  const getExistingPaperProducts = order => {
    const result = [];

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
        index: nextIndex,
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

            {existingPaperProducts.length > 0 && (
              <View>
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
              {order.jobDate ? order.jobDate.toDate().toDateString() : 'N/A'}
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
        <ScrollView contentContainerStyle={styles.homeSubContainer}>
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
                />
              )}
            </View>
          ) : null}

          {/* Material Usage for Each Paper Product - PUNCHING PHASE */}
          <View style={styles.completionFieldsContainer}>
            <Text
              style={[
                styles.boldText,
                {marginBottom: 10, fontSize: 16, width: '100%'},
              ]}>
              Job Completion Details - Punching Phase
            </Text>

            {materialUsageData.map((paperItem, idx) => (
              <View key={idx} style={styles.paperProductSection}>
                <Text style={styles.paperProductTitle}>
                  Paper Product:{' '}
                  {paperItem.paperProductCode?.label ||
                    paperItem.paperProductCode}{' '}
                  - {paperItem.paperProductNo}
                </Text>

                <View style={styles.detailsRowContainer}>
                  <Text style={styles.boldText}>Used</Text>
                  <TextInput
                    style={[styles.enableDropdown, {backgroundColor: '#fff'}]}
                    value={paperItem.punching.used}
                    onChangeText={text => {
                      const numericValue = text.replace(/[^0-9.]/g, '');
                      updateMaterialUsage(idx, 'used', numericValue);
                    }}
                    placeholder="Enter Used"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.detailsRowContainer}>
                  <Text style={styles.boldText}>Waste</Text>
                  <TextInput
                    style={[styles.enableDropdown, {backgroundColor: '#fff'}]}
                    value={paperItem.punching.waste}
                    onChangeText={text => {
                      const numericValue = text.replace(/[^0-9.]/g, '');
                      updateMaterialUsage(idx, 'waste', numericValue);
                    }}
                    placeholder="Enter Waste"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.detailsRowContainer}>
                  <Text style={styles.boldText}>Leftover (LO)</Text>
                  <TextInput
                    style={[styles.enableDropdown, {backgroundColor: '#fff'}]}
                    value={paperItem.punching.leftover}
                    onChangeText={text => {
                      const numericValue = text.replace(/[^0-9.]/g, '');
                      updateMaterialUsage(idx, 'leftover', numericValue);
                    }}
                    placeholder="Enter Leftover"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.detailsRowContainer}>
                  <Text style={styles.boldText}>WIP</Text>
                  <TextInput
                    style={[styles.enableDropdown, {backgroundColor: '#fff'}]}
                    value={paperItem.punching.wip}
                    onChangeText={text => {
                      const numericValue = text.replace(/[^0-9.]/g, '');
                      updateMaterialUsage(idx, 'wip', numericValue);
                    }}
                    placeholder="Enter WIP"
                    keyboardType="numeric"
                  />
                </View>

                {idx < materialUsageData.length - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            ))}
          </View>

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
        </ScrollView>
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
  },
  dropdownText: {
    fontSize: 14,
    fontFamily: 'Lato-Black',
    color: '#000',
    marginVertical: 10,
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
  completionFieldsContainer: {
    marginTop: 15,
    marginBottom: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  detailsRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    width: '100%',
  },
  boldText: {
    fontSize: 14,
    fontFamily: 'Lato-Black',
    color: '#000',
    width: '20%',
  },
  enableDropdown: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    height: 40,
    width: '80%',
  },
  paperProductSection: {
    marginBottom: 20,
  },
  paperProductTitle: {
    fontSize: 15,
    fontFamily: 'Lato-Bold',
    color: '#3668B1',
    marginBottom: 10,
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginTop: 20,
    marginBottom: 10,
  },
});
