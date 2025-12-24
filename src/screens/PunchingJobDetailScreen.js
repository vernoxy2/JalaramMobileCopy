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
  const [paperCodeValue, setPaperCodeValue] = useState(
    typeof order.paperCode === 'string' || typeof order.paperCode === 'number'
      ? String(order.paperCode)
      : '',
  );
  const [isPunchingStart, setIsPunchingStart] = useState(
    order.isPunchingStart || false,
  );

  // ✅ Store allocated materials from admin (from printing stage)
  const [allocatedMaterials, setAllocatedMaterials] = useState([]);

  // Material usage data for each paper product
  const [materialUsageData, setMaterialUsageData] = useState([]);
  const [showLatestHighlight, setShowLatestHighlight] = useState(true);

  // Helper function to safely extract label from object or return string
  const getDisplayValue = value => {
    if (!value) return '-';
    if (typeof value === 'string' || typeof value === 'number')
      return String(value);
    if (typeof value === 'object') {
      if (value.label) return value.label;
      if (value.value) return value.value;
      return '-';
    }
    return '-';
  };

  // Load allocated materials and material usage data from order
  // useEffect(() => {
  //   if (!order) return;

  //   // ✅ Extract allocated materials from order
  //   const materials = [];

  //   // Check for main paper product
  //   if (order.paperProductCode) {
  //     materials.push({
  //       code: order.paperProductCode,
  //       number: order.paperProductNo || '',
  //       originalAllocatedQty: order.allocatedQty || 0, // Original qty from raw material
  //       materialCategory: order.materialCategory || 'RAW',
  //       index: 0,
  //     });
  //   }

  //   // Check for additional paper products (paperProductCode1-10)
  //   for (let i = 1; i <= 10; i++) {
  //     const codeKey = `paperProductCode${i}`;
  //     const numberKey = `paperProductNo${i}`;
  //     const qtyKey = `allocatedQty${i}`;
  //     const categoryKey = `materialCategory${i}`;

  //     if (order[codeKey]) {
  //       materials.push({
  //         code: order[codeKey],
  //         number: order[numberKey] || '',
  //         originalAllocatedQty: order[qtyKey] || 0,
  //         materialCategory: order[categoryKey] || 'RAW',
  //         index: i,
  //       });
  //     }
  //   }

  //   setAllocatedMaterials(materials);

  //   // Initialize material usage data for each allocated material
  //   const initialUsageData = materials.map(material => {
  //     // Find existing tracking data for this paper product
  //     const existingData =
  //       order.materialUsageTracking?.find(
  //         item => item.paperProductNo === material.number,
  //       ) || {};

  //     // ✅ NEW LOGIC: For punching stage, the allocated qty is the "used" qty from printing stage
  //     const punchingAllocatedQty = existingData.printing?.used || 0;

  //     return {
  //       paperProductCode: material.code,
  //       paperProductNo: material.number,
  //       originalAllocatedQty: material.originalAllocatedQty, // Original raw material qty
  //       allocatedQty: punchingAllocatedQty, // ✅ This is what punching stage receives (printing's "used")
  //       materialCategory: material.materialCategory,
  //       printing: existingData.printing || null, // Already completed in printing stage
  //       punching: {
  //         used: existingData.punching?.used?.toString() || '',
  //         waste: existingData.punching?.waste?.toString() || '',
  //         leftover: existingData.punching?.leftover?.toString() || '',
  //         wip: existingData.punching?.wip?.toString() || '',
  //       },
  //       slitting: existingData.slitting || null, // Will be filled in slitting stage
  //     };
  //   });

  //   setMaterialUsageData(initialUsageData);
  // }, [order]);

  // Load allocated materials and material usage data from order

  useEffect(() => {
    // Only set timer if there are materials with latest flag
    const hasLatestMaterial = materialUsageData.some(m => m.isLatest);

    if (hasLatestMaterial) {
      // Set timer to remove highlight after 10 seconds (10000ms)
      const timer = setTimeout(() => {
        setShowLatestHighlight(false);
      }, 10000);

      // Cleanup timer on unmount
      return () => clearTimeout(timer);
    }
  }, [materialUsageData]);

  useEffect(() => {
    if (!order) return;

    // ✅ Extract allocated materials from order WITH TIMESTAMPS
    const materials = [];

    // Check for main paper product
    if (order.paperProductCode) {
      const allocatedAt =
        order.allocatedAt?.toDate?.() || order.allocatedAt || null;

      materials.push({
        code: order.paperProductCode,
        number: order.paperProductNo || '',
        originalAllocatedQty: order.allocatedQty || 0,
        allocatedRolls: order.allocatedRolls || 0, // ✅ Added
        materialCategory: order.materialCategory || 'RAW',
        allocatedAt: allocatedAt,
        index: 0,
      });
    }

    // Check for additional paper products (paperProductCode1-10)
    for (let i = 1; i <= 10; i++) {
      const codeKey = `paperProductCode${i}`;
      const numberKey = `paperProductNo${i}`;
      const qtyKey = `allocatedQty${i}`;
      const rollsKey = `allocatedRolls${i}`; // ✅ Added
      const categoryKey = `materialCategory${i}`;
      const timestampKey = `allocatedAt${i}`;

      if (order[codeKey]) {
        const allocatedAt =
          order[timestampKey]?.toDate?.() || order[timestampKey] || null;

        materials.push({
          code: order[codeKey],
          number: order[numberKey] || '',
          originalAllocatedQty: order[qtyKey] || 0,
          allocatedRolls: order[rollsKey] || 0, // ✅ Added
          materialCategory: order[categoryKey] || 'RAW',
          allocatedAt: allocatedAt,
          index: i,
        });
      }
    }

    // ✅ Sort materials: Latest allocated first (descending order)
    materials.sort((a, b) => {
      if (!a.allocatedAt && !b.allocatedAt) return 0;
      if (!a.allocatedAt) return 1;
      if (!b.allocatedAt) return -1;
      return b.allocatedAt - a.allocatedAt;
    });

    // ✅ Mark the latest material (first one after sorting)
    if (materials.length > 0 && materials[0].allocatedAt) {
      materials[0].isLatest = true;
    }

    setAllocatedMaterials(materials);

    // Initialize material usage data for each allocated material
    const initialUsageData = materials.map(material => {
      const existingData =
        order.materialUsageTracking?.find(
          item => item.paperProductNo === material.number,
        ) || {};

      // ✅ FIX: Use originalAllocatedQty if printing.used doesn't exist yet
      const punchingAllocatedQty =
        existingData.printing?.used || material.originalAllocatedQty;

      return {
        paperProductCode: material.code,
        paperProductNo: material.number,
        originalAllocatedQty: material.originalAllocatedQty,
        allocatedQty: punchingAllocatedQty,
        allocatedRolls: material.allocatedRolls, // ✅ Added
        materialCategory: material.materialCategory,
        isLatest: material.isLatest || false,
        printing: existingData.printing || null,
        punching: {
          used: existingData.punching?.used?.toString() || '',
          waste: existingData.punching?.waste?.toString() || '',
          leftover: existingData.punching?.leftover?.toString() || '',
          wip: existingData.punching?.wip?.toString() || '',
        },
        slitting: existingData.slitting || null,
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

  // ✅ VALIDATION FUNCTIONS
  // Calculate total for a specific paper product in punching stage
  const calculateTotal = paperItem => {
    const used = parseFloat(paperItem.punching.used) || 0;
    const waste = parseFloat(paperItem.punching.waste) || 0;
    const leftover = parseFloat(paperItem.punching.leftover) || 0;
    const wip = parseFloat(paperItem.punching.wip) || 0;
    return used + waste + leftover + wip;
  };

  // Validate all materials before submission
  const validateMaterialQuantities = () => {
    const errors = [];

    materialUsageData.forEach((item, index) => {
      const total = calculateTotal(item);
      const allocated = parseFloat(item.allocatedQty) || 0; // This is printing's "used" qty

      if (Math.abs(total - allocated) > 0.01) {
        // Using 0.01 tolerance for floating point
        const paperCode = item.paperProductCode?.label || item.paperProductCode;
        errors.push({
          paperCode,
          paperNo: item.paperProductNo,
          total: total.toFixed(2),
          allocated: allocated.toFixed(2),
          difference: (total - allocated).toFixed(2),
        });
      }
    });

    return errors;
  };

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

      // ✅ NEW: Validate quantities match allocated materials (printing's used qty)
      const validationErrors = validateMaterialQuantities();

      if (validationErrors.length > 0) {
        const errorMessages = validationErrors
          .map(
            err =>
              `${err.paperCode} (${err.paperNo}):\n` +
              `Total: ${err.total}m | Allocated from Printing: ${err.allocated}m\n` +
              `Difference: ${err.difference}m`,
          )
          .join('\n\n');

        Alert.alert(
          'Quantity Mismatch',
          `The sum of Used, Waste, LO, and WIP must exactly match the allocated quantity from printing stage:\n\n${errorMessages}`,
          [{text: 'OK'}],
        );
        return;
      }

      // Validate paper code for non-printing jobs
      if (order.jobType !== 'Printing') {
        if (!paperCodeValue?.trim() && !order.paperCode) {
          Alert.alert(
            'Missing Field',
            'Please enter the Paper Code before completing punching.',
          );
          return;
        }
      }

      const orderRef = firestore().collection('ordersTest').doc(order.id);

      const materialUsageTracking = [];

      // ✅ CREATE LO AND WIP MATERIALS + TRANSACTIONS
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
          materialCategory: 'WIP', // Consuming WIP from printing

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

        // ✅ STEP 4: Add to materialUsageTracking
        materialUsageTracking.push({
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
          slitting: null, // Will be filled in slitting stage
        });
      }

      // ✅ UPDATE ORDER DOCUMENT
      console.log('Submitting punching data:', {
        materialUsageTracking,
      });

      await orderRef.update({
        jobStatus: 'Slitting',
        punchingStatus: 'completed',
        paperCode: paperCodeValue || order.paperCode || '',
        updatedByPunchingAt: firestore.FieldValue.serverTimestamp(),
        assignedTo: 'sDdHMFBdkrhF90pwSk0g1ALcct33',
        completedByPunching: currentUser.uid,
        materialUsageTracking: materialUsageTracking,
      });

      Alert.alert(
        'Success',
        'Punching completed! LO and WIP materials created.',
      );

      setTimeout(() => {
        navigation.goBack();
      }, 500);
    } catch (error) {
      console.error('Error completing punching - Full error:', error);
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

      const jobRef = firestore().collection('ordersTest').doc(order.id);

      await jobRef.update({
        startByPunching: currentUser.uid,
        punchingStartAt: firestore.FieldValue.serverTimestamp(),
        isPunchingStart: true,
        punchingStatus: 'started',
        jobStatus: 'Punching',
      });

      setIsPunchingStart(true);
      Alert.alert('Success', 'Punching started successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error starting punching:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      Alert.alert('Error', 'Failed to start punching');
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        showHeadingSection1Container
        showBackBtn
        showHeadingTextContainer
        headingTitle="Punching Job Card"
      />

      {!isPunchingStart ? (
        <>
          <ScrollView contentContainerStyle={styles.content}>
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
              {order.jobDate ? order.jobDate.toDate().toDateString() : '-'}
            </Text>

            <Text style={styles.label}>Job Status:</Text>
            <Text style={styles.value}>{order.jobStatus}</Text>

            <Text style={styles.label}>Job Paper:</Text>
            <Text style={styles.value}>{getDisplayValue(order.jobPaper)}</Text>

            <Text style={styles.label}>Job Size:</Text>
            <Text style={styles.value}>{order.jobSize}</Text>

            <Text style={styles.label}>Printing Plate Size:</Text>
            <Text style={styles.value}>
              {getDisplayValue(order.printingPlateSize)}
            </Text>

            <Text style={styles.label}>Across Ups:</Text>
            <Text style={styles.value}>{getDisplayValue(order.upsAcross)}</Text>

            <Text style={styles.label}>Across Gap:</Text>
            <Text style={styles.value}>{order.acrossGap}</Text>

            <Text style={styles.label}>Around:</Text>
            <Text style={styles.value}>{getDisplayValue(order.around)}</Text>

            <Text style={styles.label}>Around Gap:</Text>
            <Text style={styles.value}>{order.aroundGap}</Text>

            <Text style={styles.label}>Teeth Size:</Text>
            <Text style={styles.value}>{getDisplayValue(order.teethSize)}</Text>

            <Text style={styles.label}>Blocks:</Text>
            <Text style={styles.value}>{getDisplayValue(order.blocks)}</Text>

            <Text style={styles.label}>Winding Direction:</Text>
            <Text style={styles.value}>
              {getDisplayValue(order.windingDirection)}
            </Text>

            <Text style={styles.label}>Running Mtrs:</Text>
            <Text style={styles.value}>{order.runningMtr || '-'}</Text>

            {/* ✅ Display Allocated Materials from Printing Stage (READ-ONLY) */}
            <View style={styles.allocatedMaterialsContainer}>
              <Text style={styles.sectionTitle}>
                Materials Received {order.jobType === 'Printing' ? 'from Printing Stage' : ''}:
              </Text>
              {materialUsageData.length === 0 ? (
                <Text style={styles.noMaterialText}>
                  No materials received.  {order.jobType === 'Printing' ? 'Please complete printing stage first.' : ''}
                </Text>
              ) : (
                materialUsageData.map((material, index) => (
                  <View
                    key={index}
                    style={[
                      styles.materialCard,
                      material.isLatest &&
                        showLatestHighlight &&
                        styles.latestMaterialCard,
                    ]}>
                    {material.isLatest && showLatestHighlight && (
                      <View style={styles.newBadge}>
                        <Text style={styles.newBadgeText}>LATEST</Text>
                      </View>
                    )}
                    <Text style={styles.materialLabel}>
                      Paper Product Code:
                    </Text>
                    <Text style={styles.materialValue}>
                      {getDisplayValue(material.paperProductCode)}
                    </Text>

                    <Text style={styles.materialLabel}>Paper Product No:</Text>
                    <Text style={styles.materialValue}>
                      {material.paperProductNo}
                    </Text>

                    <Text style={styles.materialLabel}>
                      Allocated Qty:
                    </Text>
                    <Text style={[styles.materialValue, styles.highlightedQty]}>
                      {material.allocatedQty}m
                    </Text>

                    <Text style={styles.materialLabel}>Category:</Text>
                    <Text style={styles.materialValue}>
                      {material.materialCategory}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
          {!isCompleted && (
            <View style={styles.buttonContainer}>
              <Button
                title="Start Punching"
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

          {order.jobType !== 'Printing' && (
            <View>
              <Text style={styles.label}>Paper Code:</Text>
              {order.paperCode ? (
                <Text style={styles.value}>
                  {getDisplayValue(order.paperCode)}
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
          )}

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
                  Paper Product: {getDisplayValue(paperItem.paperProductCode)} -{' '}
                  {paperItem.paperProductNo}
                </Text>
                <Text style={styles.allocatedQtyText}>
                  Allocated {order.jobType === 'Printing' ? 'from Printing' : 'Material'}: {paperItem.allocatedQty}m (
                  {paperItem.materialCategory})
                </Text>

                <View style={styles.detailsRowContainer}>
                  <Text style={styles.boldText}>F.G.</Text>
                  <TextInput
                    style={[styles.enableDropdown, {backgroundColor: '#fff'}]}
                    value={paperItem.punching.used}
                    onChangeText={text => {
                      const numericValue = text.replace(/[^0-9.]/g, '');
                      updateMaterialUsage(idx, 'used', numericValue);
                    }}
                    placeholder="Enter F.G."
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

                {/* ✅ Real-time Total Display */}
                {/* <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text
                    style={[
                      styles.totalValue,
                      calculateTotal(paperItem) === paperItem.allocatedQty
                        ? styles.totalMatch
                        : styles.totalMismatch,
                    ]}>
                    {calculateTotal(paperItem).toFixed(2)}m /{' '}
                    {paperItem.allocatedQty}m
                  </Text>
                </View> */}

                {/* Divider between paper products */}
                {idx < materialUsageData.length - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            ))}
          </View>

          {!isCompleted && (
            <View style={styles.buttonContainer}>
              <Button
                title="Complete Punching"
                onPress={handlePunchingComplete}
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
  buttonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
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
    marginBottom: 5,
    marginTop: 10,
  },
  allocatedQtyText: {
    fontSize: 13,
    fontFamily: 'Lato-Regular',
    color: '#666',
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginTop: 20,
    marginBottom: 10,
  },
  allocatedMaterialsContainer: {
    marginTop: 20,
    marginBottom: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Lato-Bold',
    color: '#000',
    marginBottom: 15,
  },
  noMaterialText: {
    fontSize: 14,
    fontFamily: 'Lato-Regular',
    color: '#999',
    fontStyle: 'italic',
  },
  materialCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  materialLabel: {
    fontSize: 13,
    fontFamily: 'Lato-Bold',
    color: '#666',
    marginTop: 5,
  },
  materialValue: {
    fontSize: 14,
    fontFamily: 'Lato-Regular',
    color: '#000',
    marginBottom: 5,
  },
  highlightedQty: {
    fontSize: 16,
    fontFamily: 'Lato-Bold',
    color: '#2196F3',
  },
  latestMaterialCard: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
    borderWidth: 2,
    shadowColor: '#2196F3',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#2196F3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Lato-Bold',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
