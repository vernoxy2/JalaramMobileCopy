import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Button,
  Alert,
  Pressable,
  TextInput,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import CustomHeader from '../components/CustomHeader';
import CustomButton from '../components/CustomButton';
import {format} from 'date-fns';
import auth from '@react-native-firebase/auth';
import CustomDropdown from '../components/CustomDropdown';
import {upsLabels} from '../constant/constant';

const SlittingJobDetailsScreen = ({route, navigation}) => {
  const order = React.useMemo(
    () => route?.params?.order || {},
    [route?.params?.order],
  );

  const [inputs, setInputs] = useState([{A: '', B: '', C: ''}]);
  const [totalA, setTotalA] = useState(0);
  const [totalB, setTotalB] = useState(0);
  const [totalC, setTotalC] = useState(0);
  const [isSlittingStart, setIsSlittingStart] = useState(
    order.isSlittingStart || false,
  );
  const [upsLabel, setUpsLabel] = useState('');

  // ✅ Store allocated materials from punching stage
  const [allocatedMaterials, setAllocatedMaterials] = useState([]);

  // Material usage data for each paper product
  const [materialUsageData, setMaterialUsageData] = useState([]);

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

  const formatTimestamp = timestamp => {
    if (!timestamp) return 'Not started yet';
    return format(timestamp.toDate(), 'dd MMM yyyy, hh:mm a');
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
  //       originalAllocatedQty: order.allocatedQty || 0,
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

  //     // ✅ NEW LOGIC: For slitting stage, the allocated qty is the "used" qty from punching stage
  //     const slittingAllocatedQty = existingData.punching?.used || 0;

  //     return {
  //       paperProductCode: material.code,
  //       paperProductNo: material.number,
  //       originalAllocatedQty: material.originalAllocatedQty, // Original raw material qty
  //       allocatedQty: slittingAllocatedQty, // ✅ This is what slitting stage receives (punching's "used")
  //       materialCategory:material.materialCategory, // Changed from RAW to WIP since it's output from punching
  //       printing: existingData.printing || null, // Already completed in printing stage
  //       punching: existingData.punching || null, // Already completed in punching stage
  //       slitting: {
  //         used: existingData.slitting?.used?.toString() || '',
  //         waste: existingData.slitting?.waste?.toString() || '',
  //         // ✅ LO and WIP are always 0 for slitting (final stage)
  //         leftover: '0',
  //         wip: '0',
  //       },
  //     };
  //   });

  //   setMaterialUsageData(initialUsageData);
  // }, [order]);

  // Replace the existing useEffect that loads materials with this fixed version:

  useEffect(() => {
    if (!order) return;

    // ✅ FIXED: Load materials directly from materialUsageTracking
    // This is where punching stage stores its output
    if (order.materialUsageTracking && order.materialUsageTracking.length > 0) {
      console.log(
        '📦 Loading materials from materialUsageTracking:',
        order.materialUsageTracking,
      );

      const initialUsageData = order.materialUsageTracking.map(
        (trackingItem, index) => {
          // ✅ The allocated qty for slitting is the "used" qty from punching stage
          const slittingAllocatedQty = trackingItem.punching?.used || 0;

          console.log(`Material ${index}:`, {
            code: trackingItem.paperProductCode,
            no: trackingItem.paperProductNo,
            punchingUsed: trackingItem.punching?.used,
            slittingAllocatedQty,
          });

          return {
            paperProductCode: trackingItem.paperProductCode,
            paperProductNo: trackingItem.paperProductNo,
            originalAllocatedQty: 0, // Not needed for slitting
            allocatedQty: slittingAllocatedQty, // ✅ This is what slitting receives
            materialCategory: 'WIP', // Changed from RAW to WIP (output from punching)
            printing: trackingItem.printing || null,
            punching: trackingItem.punching || null,
            slitting: {
              used: trackingItem.slitting?.used?.toString() || '',
              waste: trackingItem.slitting?.waste?.toString() || '',
              leftover: '0',
              wip: '0',
            },
          };
        },
      );

      setMaterialUsageData(initialUsageData);

      // Also update allocatedMaterials for display
      const materials = order.materialUsageTracking.map((item, index) => ({
        code: item.paperProductCode,
        number: item.paperProductNo,
        originalAllocatedQty: item.punching?.used || 0,
        materialCategory: 'WIP',
        index: index,
      }));

      setAllocatedMaterials(materials);
    } else {
      console.warn(
        '⚠️ No materialUsageTracking found in order. Punching stage may not be completed.',
      );
      setMaterialUsageData([]);
      setAllocatedMaterials([]);
    }
  }, [order]);

  // Update material usage for specific paper product
  const updateMaterialUsage = (index, field, value) => {
    setMaterialUsageData(prev =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              slitting: {
                ...item.slitting,
                [field]: value,
              },
            }
          : item,
      ),
    );
  };

  // ✅ VALIDATION FUNCTIONS
  // Calculate total for a specific paper product in slitting stage
  const calculateTotal = paperItem => {
    const used = parseFloat(paperItem.slitting.used) || 0;
    const waste = parseFloat(paperItem.slitting.waste) || 0;
    // LO and WIP are always 0 for slitting
    return used + waste;
  };

  // Validate all materials before submission
  const validateMaterialQuantities = () => {
    const errors = [];

    materialUsageData.forEach((item, index) => {
      const total = calculateTotal(item);
      const allocated = parseFloat(item.allocatedQty) || 0; // This is punching's "used" qty

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

  useEffect(() => {
    let sumA = 0,
      sumB = 0,
      sumC = 0;
    inputs.forEach(input => {
      const A = parseFloat(input.A) || 0;
      const B = parseFloat(input.B) || 0;
      const C = parseFloat(input.C) || 0;

      sumA += A;
      sumB += B;
      sumC += C;
    });
    setTotalA(sumA);
    setTotalB(sumB);
    setTotalC(sumC);
  }, [inputs]);

  const addInputField = () => {
    setInputs([...inputs, {A: '', B: '', C: ''}]);
  };

  const handleInputChange = (text, index, field) => {
    const updatedInputs = [...inputs];
    updatedInputs[index][field] = text;

    if (field === 'A' || field === 'B') {
      const A = parseFloat(updatedInputs[index].A) || 0;
      const B = parseFloat(updatedInputs[index].B) || 0;
      updatedInputs[index].C = (A * B).toString();
    }

    setInputs(updatedInputs);
  };

  const handleComplete = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // Validate that all material usage fields are filled (only used and waste)
      const hasEmptyFields = materialUsageData.some(
        item => !item.slitting.used || !item.slitting.waste,
      );

      if (hasEmptyFields) {
        Alert.alert(
          'Missing Data',
          'Please fill Used and Waste fields for each paper product',
        );
        return;
      }

      // ✅ NEW: Validate quantities match allocated materials (punching's used qty)
      const validationErrors = validateMaterialQuantities();

      if (validationErrors.length > 0) {
        const errorMessages = validationErrors
          .map(
            err =>
              `${err.paperCode} (${err.paperNo}):\n` +
              `Total (Used + Waste): ${err.total}m | Allocated from Punching: ${err.allocated}m\n` +
              `Difference: ${err.difference}m`,
          )
          .join('\n\n');

        Alert.alert(
          'Quantity Mismatch',
          `The sum of Used and Waste must exactly match the allocated quantity from punching stage:\n\n${errorMessages}`,
          [{text: 'OK'}],
        );
        return;
      }

      const orderRef = firestore().collection('ordersTest').doc(order.id);

      const materialUsageTracking = [];

      // ✅ CREATE LO AND WIP MATERIALS + TRANSACTIONS
      // Note: For slitting, LO and WIP are always 0, so we won't create those materials
      for (const item of materialUsageData) {
        const codeValue = item.paperProductCode?.label || item.paperProductCode;
        const paperProductNo = item.paperProductNo;

        const usedQty = parseFloat(item.slitting.used) || 0;
        const wasteQty = parseFloat(item.slitting.waste) || 0;
        const loQty = 0; // ✅ Always 0 for slitting (final stage)
        const wipQty = 0; // ✅ Always 0 for slitting (final stage)

        // ✅ CREATE TRANSACTION RECORD (no LO or WIP materials created)
        const transactionData = {
          transactionType: 'consumption',
          transactionDate: firestore.FieldValue.serverTimestamp(),
          jobCardNo: order.jobCardNo,
          orderRef: order.id,
          stage: 'slitting',

          // Material details
          paperCode: codeValue,
          paperProductCode: codeValue,
          paperProductNo: paperProductNo,
          materialCategory: 'WIP', // Consuming WIP from punching

          // Quantities
          usedQty: usedQty,
          wasteQty: wasteQty,
          loQty: loQty,
          wipQty: wipQty,

          // No new materials created in slitting (final stage)
          newPaperCode: null,
          loMaterialId: null,
          wipMaterialId: null,

          createdBy: currentUser.uid,
          remarks: `Slitting stage completed for job ${order.jobCardNo} - Final stage`,
        };

        await firestore()
          .collection('materialTransactions')
          .add(transactionData);

        console.log('✅ Transaction Created for:', codeValue);

        // ✅ ADD TO MATERIAL USAGE TRACKING
        materialUsageTracking.push({
          paperProductCode: codeValue,
          paperProductNo: paperProductNo,
          printing: item.printing, // Keep existing printing data
          punching: item.punching, // Keep existing punching data
          slitting: {
            used: usedQty,
            waste: wasteQty,
            leftover: loQty, // Always 0
            wip: wipQty, // Always 0
            completedAt: new Date(),
            completedBy: currentUser.uid,
          },
        });
      }

      // ✅ UPDATE ORDER DOCUMENT
      console.log('Submitting slitting data:', {
        materialUsageTracking,
      });

      await orderRef.update({
        jobStatus: 'Completed',
        slittingStatus: 'completed',
        assignedTo: 'adminUID',
        endTime: firestore.FieldValue.serverTimestamp(),
        updatedBySlittingAt: firestore.FieldValue.serverTimestamp(),
        slittingData: inputs,
        completedBySlitting: currentUser.uid,
        isSlittingStart: false,
        upsLabel: upsLabel,
        materialUsageTracking: materialUsageTracking,
      });

      Alert.alert('Success', 'Job completed successfully! (Final stage)');

      setTimeout(() => {
        navigation.goBack();
      }, 500);
    } catch (error) {
      console.error('Error completing job - Full error:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      Alert.alert('Error', `Failed to complete job: ${error.message}`);
    }
  };

  const handleSlittingStart = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      await firestore().collection('ordersTest').doc(order.id).update({
        jobStatus: 'Slitting',
        slittingStatus: 'started',
        startBySlittingAt: firestore.FieldValue.serverTimestamp(),
        isSlittingStart: true,
        updatedBySlittingAt: firestore.FieldValue.serverTimestamp(),
      });

      setIsSlittingStart(true);
      Alert.alert('Success', 'Slitting started successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error starting slitting:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      Alert.alert('Error', 'Failed to start slitting');
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        showHeadingSection1Container={true}
        showBackBtn={true}
        showHeadingTextContainer={true}
        headingTitle={'Slitting Job Card'}
      />
      {!isSlittingStart ? (
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

            {order.jobType !== 'Printing' && (
              <View>
                <Text style={styles.label}>Paper Code:</Text>
                <Text style={styles.value}>
                  {getDisplayValue(order.paperCode)}
                </Text>
              </View>
            )}

            {/* ✅ Display Allocated Materials from Punching Stage (READ-ONLY) */}
            <View style={styles.allocatedMaterialsContainer}>
              <Text style={styles.sectionTitle}>
                Materials Received from Punching Stage:
              </Text>
              {materialUsageData.length === 0 ? (
                <Text style={styles.noMaterialText}>
                  No materials received. Please complete punching stage first.
                </Text>
              ) : (
                materialUsageData.map((material, index) => (
                  <View key={index} style={styles.materialCard}>
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
                      Allocated Qty (Punching's FG):
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
          <View style={styles.buttonContainer}>
            <CustomButton
              onPress={handleSlittingStart}
              title={'Start Slitting'}
              style={styles.completeBtn}
            />
          </View>
        </>
      ) : (
        <ScrollView>
          <View style={styles.homeSubContainer}>
            <Text style={styles.label}>Job Card No:</Text>
            <Text style={styles.value}>{order.jobCardNo}</Text>

            <Text style={styles.label}>Job Qty:</Text>
            <Text style={styles.value}>{order.jobQty}</Text>

            <CustomDropdown
              placeholder={'Label Ups'}
              data={upsLabels}
              style={styles.dropdownContainer}
              selectedText={styles.dropdownText}
              onSelect={item => setUpsLabel(item)}
              showIcon={true}
            />

            <Pressable style={styles.addButton} onPress={addInputField}>
              <Text style={styles.buttonText}>Add Row</Text>
            </Pressable>

            <View style={styles.headingRow}>
              <Text style={styles.headingText}>No of Labels</Text>
              <Text style={styles.headingText}>No of Rolls</Text>
              <Text style={styles.headingText}>Total</Text>
            </View>
            {inputs.map((input, index) => (
              <View key={index} style={styles.row}>
                <TextInput
                  style={styles.textInput}
                  value={input.A}
                  placeholder="A"
                  keyboardType="numeric"
                  onChangeText={text => handleInputChange(text, index, 'A')}
                />

                <TextInput
                  style={styles.textInput}
                  value={input.B}
                  placeholder="B"
                  keyboardType="numeric"
                  onChangeText={text => handleInputChange(text, index, 'B')}
                />

                <TextInput
                  style={styles.textInput}
                  value={input.C}
                  editable={false}
                  placeholder="C"
                />
              </View>
            ))}
            <View style={styles.horizontalLine} />
            <View style={styles.row}>
              <View>
                <Text style={styles.totalText}>Total Labels</Text>
                <TextInput
                  style={styles.textInput}
                  value={totalA.toString()}
                  editable={false}
                />
              </View>
              <View>
                <Text style={styles.totalText}>Total Rolls</Text>
                <TextInput
                  style={styles.textInput}
                  value={totalB.toString()}
                  editable={false}
                />
              </View>
              <View>
                <Text style={styles.totalText}>Grand Total</Text>
                <TextInput
                  style={styles.textInput}
                  value={totalC.toString()}
                  editable={false}
                />
              </View>
            </View>

            {/* Material Usage for Each Paper Product - SLITTING PHASE */}
            <View style={styles.completionFieldsContainer}>
              <Text
                style={[
                  styles.boldText,
                  {marginBottom: 10, fontSize: 16, width: '100%'},
                ]}>
                Job Completion Details - Slitting Phase (Final Stage)
              </Text>

              {materialUsageData.map((paperItem, idx) => (
                <View key={idx} style={styles.paperProductSection}>
                  <Text style={styles.paperProductTitle}>
                    Paper Product: {getDisplayValue(paperItem.paperProductCode)}{' '}
                    - {paperItem.paperProductNo}
                  </Text>
                  <Text style={styles.allocatedQtyText}>
                    Allocated from Punching: {paperItem.allocatedQty}m (
                    {paperItem.materialCategory})
                  </Text>

                  <View style={styles.detailsRowContainer}>
                    <Text style={styles.boldText}>F.G.</Text>
                    <TextInput
                      style={[styles.enableDropdown, {backgroundColor: '#fff'}]}
                      value={paperItem.slitting.used}
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
                      value={paperItem.slitting.waste}
                      onChangeText={text => {
                        const numericValue = text.replace(/[^0-9.]/g, '');
                        updateMaterialUsage(idx, 'waste', numericValue);
                      }}
                      placeholder="Enter Waste"
                      keyboardType="numeric"
                    />
                  </View>

                  {idx < materialUsageData.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </View>
              ))}
            </View>

            <View style={styles.buttonContainer}>
              <CustomButton
                onPress={handleComplete}
                title={'Complete Slitting'}
                style={styles.completeBtn}
              />
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default SlittingJobDetailsScreen;

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
    marginTop: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  addButton: {
    height: 50,
    width: '100%',
    backgroundColor: '#3668B1',
    marginVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Lato-Black',
  },
  textInput: {
    height: 40,
    width: 80,
    borderColor: 'gray',
    borderWidth: 1,
    marginVertical: 10,
    paddingLeft: 10,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headingRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headingText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
    width: '27%',
  },
  totalText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
  horizontalLine: {
    height: 1,
    width: '100%',
    backgroundColor: 'gray',
    marginVertical: 10,
  },
  completeBtn: {
    backgroundColor: '#3668B1',
    height: 50,
    width: '100%',
  },
  dropdownContainer: {
    width: '100%',
    borderRadius: 10,
    marginTop: 20,
    height: 40,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  dropdownText: {
    fontSize: 14,
    fontFamily: 'Lato-Black',
    color: '#000',
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
  boldText: {
    fontSize: 14,
    fontFamily: 'Lato-Black',
    color: '#000',
    width: '20%',
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
  // ✅ NEW: Real-time Total Display Styles
  totalContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: 'Lato-Bold',
    color: '#000',
  },
  totalValue: {
    fontSize: 14,
    fontFamily: 'Lato-Bold',
  },
});
