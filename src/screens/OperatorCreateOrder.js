import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import CustomHeader from '../components/CustomHeader';
import CustomDropdown from '../components/CustomDropdown';
import {colorAnilox, paperProductCodeData} from '../constant/constant';
import CustomColorDropdown from '../components/CustomColorDropdown';
import CustomButton from '../components/CustomButton';
import firestore from '@react-native-firebase/firestore';
import CustomTextInput from '../components/CustomTextInput';
import auth from '@react-native-firebase/auth';

const OperatorCreateOrder = ({navigation, route}) => {
  const order = React.useMemo(
    () => route?.params?.order || {},
    [route?.params?.order],
  );

  const [jobStarted, setJobStarted] = useState(order.jobStarted || false);
  const [size, setSize] = useState(order.jobSize || '');
  const [jobPaper, setJobPaper] = useState(order.jobPaper || '');
  const [paperProductCode, setPaperProductCode] = useState(
    order.paperProductCode || '',
  );
  const [plateSize, setPlateSize] = useState(order.printingPlateSize || '');
  const [upsAcrossValue, setUpsAcrossValue] = useState(order.upsAcross || '');
  const [aroundValue, setAroundValue] = useState(order.around || '');
  const [teethSizeValue, setTeethSizeValue] = useState(order.teethSize || '');
  const [blocksValue, setBlocksValue] = useState(order.blocks || '');
  const [windingDirectionValue, setWindingDirectionValue] = useState(
    order.windingDirection || '',
  );
  const [tooling, setTooling] = useState(order.tooling || '');
  const [checkboxState, setCheckboxState] = useState({
    box1: order.printingColors?.includes('Uv') || false,
    box2: order.printingColors?.includes('Water') || false,
    box3: order.printingColors?.includes('Special') || false,
    box4: order.varnish === 'Uv',
    box5: order.checkedApproved || false,
  });

  const [paperProductNo, setPaperProductNo] = useState('');
  const [runningMtrValue, setRunningMtrValue] = useState('');
  const isCompleted = order.printingStatus === 'completed';
  const [jobCardNo, setJobCardNo] = useState(order.jobCardNo || '');
  const [jobName, setJobName] = useState(order.jobName || '');
  const [sp1Color, setSp1Color] = useState('');
  const [sp2Color, setSp2Color] = useState('');
  const [sp3Color, setSp3Color] = useState('');
  const [sp4Color, setSp4Color] = useState('');
  const [customerName, setCustomerName] = useState(order.customerName || '');
  const [jobQty, setJobQty] = useState(order.jobQty || '');
  const [acrossGap, setAcrossGap] = useState(order.acrossGap || '');
  const [aroundGap, setAroundGap] = useState(order.aroundGap || '');
  const [extraPaperProducts, setExtraPaperProducts] = useState([]);

  // NEW STRUCTURED DATA: Material usage organized by paper product
  const [paperProductsList, setPaperProductsList] = useState([]);
  const [materialUsageData, setMaterialUsageData] = useState([]);

  const printingColors = [];
  if (checkboxState.box1) printingColors.push('Uv');
  if (checkboxState.box2) printingColors.push('Water');
  if (checkboxState.box3) printingColors.push('Special');

  useEffect(() => {
    if (!order) return;

    setSize(order.jobSize || '');
    setJobPaper(order.jobPaper || '');
    setPaperProductCode(order.paperProductCode || '');
    setPlateSize(order.printingPlateSize || '');
    setUpsAcrossValue(order.upsAcross || '');
    setAroundValue(order.around || '');
    setTeethSizeValue(order.teethSize || '');
    setBlocksValue(order.blocks || '');
    setWindingDirectionValue(order.windingDirection || '');
    setCheckboxState({
      box1: order.printingColors?.includes('Uv') || false,
      box2: order.printingColors?.includes('Water') || false,
      box3: order.printingColors?.includes('Special') || false,
      box4: order.varnish === 'Uv',
      box5: order.checkedApproved || false,
    });
    setTooling(order.tooling || '');
    setRunningMtrValue(order.runningMtr || '');
    setJobStarted(order.jobStarted || false);
    setJobCardNo(order.jobCardNo || '');
    setJobName(order.jobName || '');
    setJobQty(order.jobQty || '');

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
    // Load existing data if available from materialUsageTracking array
    const initialUsageData = papers.map((paper, index) => {
      // Find existing tracking data for this paper product
      const existingData =
        order.materialUsageTracking?.find(
          item => item.paperProductNo === paper.number,
        ) || {};

      return {
        paperProductCode: paper.code,
        paperProductNo: paper.number,
        printing: {
          used: existingData.printing?.used?.toString() || '',
          waste: existingData.printing?.waste?.toString() || '',
          leftover: existingData.printing?.leftover?.toString() || '',
          wip: existingData.printing?.wip?.toString() || '',
        },
        // These will be filled in next phases
        punching: existingData.punching || null,
        slitting: existingData.slitting || null,
      };
    });

    setMaterialUsageData(initialUsageData);
  }, [order]);

  const [colorAniloxValues, setColorAniloxValues] = useState({
    C: '',
    M: '',
    Y: '',
    K: '',
    Sq1: '',
    Sq2: '',
    Sq3: '',
    Sq4: '',
    Others: '',
  });

  const handleColorSelect = (colorKey, selectedValue) => {
    setColorAniloxValues(prev => ({
      ...prev,
      [colorKey]: selectedValue,
    }));
  };

  const handleCheckboxChange = box => {
    setCheckboxState(prevState => ({
      ...prevState,
      [box]: !prevState[box],
    }));
  };

  // Update material usage for specific paper product and phase
  const updateMaterialUsage = (index, field, value) => {
    setMaterialUsageData(prev =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              printing: {
                ...item.printing,
                [field]: value,
              },
            }
          : item,
      ),
    );
  };

  const startJobHandler = async () => {
    try {
      const printingColors = [];
      if (checkboxState.box1) printingColors.push('Uv');
      if (checkboxState.box2) printingColors.push('Water');
      if (checkboxState.box3) printingColors.push('Special');

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

      const orderRef = firestore().collection('ordersTest').doc(order.id);
      const extraFields = {};
      extraPaperProducts.forEach((item, index) => {
        const num = index + 1;
        extraFields[`paperProductCode${num}`] = item.code;
        extraFields[`paperProductNo${num}`] = item.number;
      });

      await orderRef.update({
        jobStarted: true,
        printingStatus: 'started',
        updatedAt: firestore.FieldValue.serverTimestamp(),
        jobSize: size,
        jobPaper,
        paperProductCode: paperProductCode,
        paperProductNo,
        ...extraFields,
        printingPlateSize: plateSize,
        upsAcross: upsAcrossValue,
        around: aroundValue,
        teethSize: teethSizeValue,
        blocks: blocksValue,
        windingDirection: windingDirectionValue,
        varnish: checkboxState.box4 ? 'Uv' : '',
        checkedApproved: checkboxState.box5,
      });

      setJobStarted(true);
      alert('Job started successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error starting job:', error);
      alert('Failed to start job');
    }
  };

  // const handleSubmit = async () => {
  //   try {
  //     const currentUser = auth().currentUser;
  //     if (!currentUser) {
  //       Alert.alert('Error', 'User not authenticated');
  //       return;
  //     }

  //     // Validate that all material usage fields are filled
  //     const hasEmptyFields = materialUsageData.some(
  //       item =>
  //         !item.printing.used ||
  //         !item.printing.waste ||
  //         !item.printing.leftover ||
  //         !item.printing.wip,
  //     );

  //     if (hasEmptyFields) {
  //       Alert.alert(
  //         'Missing Data',
  //         'Please fill all material usage fields for each paper product',
  //       );
  //       return;
  //     }

  //     const orderRef = firestore().collection('ordersTest').doc(order.id);

  //     // FIX: Use new Date() instead of serverTimestamp() inside arrays
  //     const materialUsageTracking = materialUsageData.map(item => {
  //       const codeValue = item.paperProductCode?.label || item.paperProductCode;

  //       return {
  //         paperProductCode: codeValue,
  //         paperProductNo: item.paperProductNo,
  //         printing: {
  //           used: parseFloat(item.printing.used) || 0,
  //           waste: parseFloat(item.printing.waste) || 0,
  //           leftover: parseFloat(item.printing.leftover) || 0,
  //           wip: parseFloat(item.printing.wip) || 0,
  //           completedAt: new Date(), // ✅ Changed from serverTimestamp()
  //           completedBy: currentUser.uid,
  //         },
  //         punching: null,
  //         slitting: null,
  //       };
  //     });

  //     console.log('Submitting data:', {
  //       materialUsageTracking,
  //       printingColors,
  //       colorAniloxValues,
  //     });

  //     await orderRef.update({
  //       jobPaper,
  //       runningMtr: runningMtrValue,
  //       jobStatus: 'Punching',
  //       assignedTo: 'Kt1bJQzaUPdAowP7bTpdNQEfXKO2',
  //       printingStatus: 'completed',
  //       updatedByPrintingAt: firestore.FieldValue.serverTimestamp(), // ✅ This is fine at root level
  //       completedByPrinting: currentUser.uid,
  //       colorAniloxValues,
  //       tooling,
  //       printingColors,
  //       sp1Color,
  //       sp2Color,
  //       sp3Color,
  //       sp4Color,
  //       materialUsageTracking,
  //     });

  //     alert('Job successfully updated and reassigned!');
  //     setTimeout(() => {
  //       navigation.goBack();
  //     }, 500);
  //   } catch (err) {
  //     console.error('Error updating order - Full error:', err);
  //     console.error('Error message:', err.message);
  //     console.error('Error code:', err.code);
  //     Alert.alert('Error', `Failed to update order: ${err.message}`);
  //   }
  // };

  const handleSubmit = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // Validate that all material usage fields are filled
      const hasEmptyFields = materialUsageData.some(
        item =>
          !item.printing.used ||
          !item.printing.waste ||
          !item.printing.leftover ||
          !item.printing.wip,
      );

      if (hasEmptyFields) {
        Alert.alert(
          'Missing Data',
          'Please fill all material usage fields for each paper product',
        );
        return;
      }

      const orderRef = firestore().collection('ordersTest').doc(order.id);

      // ========================================================
      // ✅ NEW: CREATE LO AND WIP MATERIALS + TRANSACTIONS
      // ========================================================

      const materialUsageTracking = [];

      for (const item of materialUsageData) {
        const codeValue = item.paperProductCode?.label || item.paperProductCode;
        const paperProductNo = item.paperProductNo;

        const usedQty = parseFloat(item.printing.used) || 0;
        const wasteQty = parseFloat(item.printing.waste) || 0;
        const loQty = parseFloat(item.printing.leftover) || 0;
        const wipQty = parseFloat(item.printing.wip) || 0;

        // ✅ STEP 1: Create LO Material (if leftover > 0)
        let loMaterialId = null;
        let loPaperCode = null;

        if (loQty > 0) {
          loPaperCode = `LO-${order.jobCardNo}-PR`;

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
            sourceStage: 'printing',

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
          wipPaperCode = `WIP-${order.jobCardNo}-PR`;

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
            sourceStage: 'printing',

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
          stage: 'printing',

          // Material details
          paperCode: codeValue,
          paperProductCode: codeValue,
          paperProductNo: paperProductNo,
          materialCategory: 'RAW', // Assuming RAW was consumed

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
          remarks: `Printing stage completed for job ${order.jobCardNo}`,
        };

        await firestore()
          .collection('materialTransactions')
          .add(transactionData);

        console.log('✅ Transaction Created for:', codeValue);

        // ✅ STEP 4: Add to materialUsageTracking (keep existing structure)
        materialUsageTracking.push({
          paperProductCode: codeValue,
          paperProductNo: paperProductNo,
          printing: {
            used: usedQty,
            waste: wasteQty,
            leftover: loQty,
            wip: wipQty,
            completedAt: new Date(),
            completedBy: currentUser.uid,
          },
          punching: null,
          slitting: null,
        });
      }

      // ========================================================
      // ✅ UPDATE ORDER DOCUMENT
      // ========================================================

      console.log('Submitting data:', {
        materialUsageTracking,
        printingColors,
        colorAniloxValues,
      });

      await orderRef.update({
        jobPaper,
        runningMtr: runningMtrValue,
        jobStatus: 'Punching',
        assignedTo: 'Kt1bJQzaUPdAowP7bTpdNQEfXKO2',
        printingStatus: 'completed',
        updatedByPrintingAt: firestore.FieldValue.serverTimestamp(),
        completedByPrinting: currentUser.uid,
        colorAniloxValues,
        tooling,
        printingColors,
        sp1Color,
        sp2Color,
        sp3Color,
        sp4Color,
        materialUsageTracking,
      });

      Alert.alert(
        'Success',
        'Job successfully completed! LO and WIP materials created.',
      );

      setTimeout(() => {
        navigation.goBack();
      }, 500);
    } catch (err) {
      console.error('Error updating order - Full error:', err);
      console.error('Error message:', err.message);
      console.error('Error code:', err.code);
      Alert.alert('Error', `Failed to update order: ${err.message}`);
    }
  };
  const addExtraPaperProduct = () => {
    if (extraPaperProducts.length >= 10) {
      Alert.alert('Limit Reached', 'You can add only up to 10 extra products');
      return;
    }

    setExtraPaperProducts(prev => [
      ...prev,
      {
        id: Date.now(),
        index: prev.length + 1,
        code: '',
        number: '',
      },
    ]);
  };

  const updateExtraPaperProduct = (id, field, value) => {
    setExtraPaperProducts(prev =>
      prev.map(item => (item.id === id ? {...item, [field]: value} : item)),
    );
  };

  const removeExtraPaperProduct = id => {
    setExtraPaperProducts(prev => prev.filter(item => item.id !== id));
  };

  return (
    <View style={styles.mainContainer}>
      <CustomHeader
        showHeadingSection1Container={true}
        showBackBtn
        showHeadingSection2Container={true}
        showHeadingTextContainer={true}
        headingTitle={'Flexo Job Card'}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled">
        <View style={styles.subContainer}>
          {!jobStarted ? (
            <>
              <View style={styles.detailsRowContainer}>
                <Text style={styles.boldText}>Job Card No</Text>
                <View style={styles.disabledDropdown}>
                  <Text style={styles.value}>{jobCardNo}</Text>
                </View>
              </View>
              <View style={styles.detailsRowContainer}>
                <Text style={styles.boldText}>Job Name</Text>
                <View style={styles.disabledDropdown}>
                  <Text style={styles.value}>{jobName}</Text>
                </View>
              </View>
              <View style={styles.detailsRowContainer}>
                <Text style={styles.boldText}>Job Qty</Text>
                <View style={styles.disabledDropdown}>
                  <Text style={styles.value}>{jobQty}</Text>
                </View>
              </View>

              <View style={styles.detailsRowContainer}>
                <Text style={styles.boldText}>Customer Name:</Text>
                <View style={styles.disabledDropdown}>
                  <Text style={styles.value}>{customerName}</Text>
                </View>
              </View>

              <View style={styles.detailsRowContainer}>
                <Text style={styles.boldText}>Job Paper</Text>
                <View style={styles.disabledDropdown}>
                  <Text style={styles.value}>{jobPaper.label}</Text>
                </View>
              </View>
              <View style={styles.detailsRowContainer}>
                <Text style={styles.boldText}>Job Size</Text>
                <View style={styles.disabledDropdown}>
                  <Text style={styles.value}>{size}</Text>
                </View>
              </View>

              <View style={styles.detailsRowContainer}>
                <Text style={styles.boldText}>Printing Plate Size</Text>
                <View style={styles.disabledDropdown}>
                  <Text style={styles.value}>{plateSize.label}</Text>
                </View>
              </View>

              <View style={styles.detailsRowContainer}>
                <Text style={styles.boldText}>Across Ups</Text>
                <View style={styles.disabledDropdown}>
                  <Text style={styles.value}>{upsAcrossValue.label}</Text>
                </View>
              </View>

              <View style={styles.detailsRowContainer}>
                <Text style={styles.boldText}>Across Gap</Text>
                <View style={styles.disabledDropdown}>
                  <Text style={styles.value}>{acrossGap}</Text>
                </View>
              </View>

              <View style={styles.detailsRowContainer}>
                <Text style={styles.boldText}>Around</Text>
                <View style={styles.disabledDropdown}>
                  <Text style={styles.value}>{aroundValue.label}</Text>
                </View>
              </View>

              <View style={styles.detailsRowContainer}>
                <Text style={styles.boldText}>Around Gap</Text>
                <View style={styles.disabledDropdown}>
                  <Text style={styles.value}>{aroundGap}</Text>
                </View>
              </View>

              <View style={styles.detailsRowContainer}>
                <Text style={styles.boldText}>Teeth Size</Text>
                <View style={styles.disabledDropdown}>
                  <Text style={styles.value}>{teethSizeValue.label}</Text>
                </View>
              </View>

              <View style={styles.detailsRowContainer}>
                <Text style={styles.boldText}>Blocks</Text>
                <View style={styles.disabledDropdown}>
                  <Text style={styles.value}>{blocksValue.label}</Text>
                </View>
              </View>
              <View style={styles.detailsRowContainer}>
                <Text style={styles.boldText}>Winding Direction</Text>
                <View style={styles.disabledDropdown}>
                  <Text style={styles.value}>
                    {windingDirectionValue.label}
                  </Text>
                </View>
              </View>

              <CustomDropdown
                placeholder={'Paper Product Code'}
                data={paperProductCodeData}
                style={styles.dropdownContainer}
                selectedText={styles.dropdownText}
                onSelect={item => setPaperProductCode(item)}
                showIcon={true}
              />

              <CustomTextInput
                placeholder="Paper Product No"
                value={paperProductNo}
                onChangeText={setPaperProductNo}
                style={{width: '100%'}}
              />

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
                  + Add Extra Paper Product
                </Text>
              </TouchableOpacity>
              <View style={styles.btnContainer}>
                <CustomButton
                  title={'Start Job'}
                  style={styles.submitBtn}
                  onPress={startJobHandler}
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.colorAniloxMainContainer}>
                <View style={styles.colorAniloxRowContainer}>
                  <Text style={styles.colorAniloxText}>Color Seq</Text>
                  <Text style={styles.colorAniloxText}>Anilox</Text>
                </View>

                <View style={styles.colorAniloxRowContainer}>
                  <Text style={styles.colorAniloxText}>C</Text>
                  <CustomColorDropdown
                    data={colorAnilox}
                    onSelect={item => handleColorSelect('C', item)}
                  />
                </View>

                <View style={styles.colorAniloxRowContainer}>
                  <Text style={styles.colorAniloxText}>M</Text>
                  <CustomColorDropdown
                    data={colorAnilox}
                    onSelect={item => handleColorSelect('M', item)}
                  />
                </View>

                <View style={styles.colorAniloxRowContainer}>
                  <Text style={styles.colorAniloxText}>Y</Text>
                  <CustomColorDropdown
                    data={colorAnilox}
                    onSelect={item => handleColorSelect('Y', item)}
                  />
                </View>

                <View style={styles.colorAniloxRowContainer}>
                  <Text style={styles.colorAniloxText}>K</Text>
                  <CustomColorDropdown
                    data={colorAnilox}
                    onSelect={item => handleColorSelect('K', item)}
                  />
                </View>

                <View style={styles.colorAniloxRowContainer}>
                  <Text style={styles.colorAniloxText}>Sp1</Text>
                  <CustomColorDropdown
                    data={colorAnilox}
                    onSelect={item => handleColorSelect('Sq1', item)}
                  />
                </View>
                <View style={styles.colorAniloxRowContainer}>
                  <Text style={styles.colorAniloxText}>Sp1 Color</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Add Color"
                    placeholderTextColor="#999"
                    value={sp1Color}
                    onChangeText={setSp1Color}
                  />
                </View>

                <View style={styles.colorAniloxRowContainer}>
                  <Text style={styles.colorAniloxText}>Sp2</Text>
                  <CustomColorDropdown
                    data={colorAnilox}
                    onSelect={item => handleColorSelect('Sq2', item)}
                  />
                </View>
                <View style={styles.colorAniloxRowContainer}>
                  <Text style={styles.colorAniloxText}>Sp2 Color</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Add Color"
                    placeholderTextColor="#999"
                    value={sp2Color}
                    onChangeText={setSp2Color}
                  />
                </View>

                <View style={styles.colorAniloxRowContainer}>
                  <Text style={styles.colorAniloxText}>Sp3</Text>
                  <CustomColorDropdown
                    data={colorAnilox}
                    onSelect={item => handleColorSelect('Sq3', item)}
                  />
                </View>
                <View style={styles.colorAniloxRowContainer}>
                  <Text style={styles.colorAniloxText}>Sp3 Color</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Add Color"
                    placeholderTextColor="#999"
                    value={sp3Color}
                    onChangeText={setSp3Color}
                  />
                </View>

                <View style={styles.colorAniloxRowContainer}>
                  <Text style={styles.colorAniloxText}>Sp4</Text>
                  <CustomColorDropdown
                    data={colorAnilox}
                    onSelect={item => handleColorSelect('Sq4', item)}
                  />
                </View>
                <View style={styles.colorAniloxRowContainer}>
                  <Text style={styles.colorAniloxText}>Sp4 Color</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Add Color"
                    placeholderTextColor="#999"
                    value={sp4Color}
                    onChangeText={setSp4Color}
                  />
                </View>
              </View>

              <View style={styles.detailsRowContainer}>
                <Text style={styles.boldText}>Running Mtrs</Text>
                <TextInput
                  style={[styles.enableDropdown, {backgroundColor: '#fff'}]}
                  value={runningMtrValue}
                  onChangeText={text => {
                    const numericValue = text.replace(/[^0-9]/g, '');
                    setRunningMtrValue(numericValue);
                  }}
                  placeholder="Enter Running Mtrs"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.detailsRowContainer}>
                <Text style={styles.boldText}>Tooling</Text>
                <TextInput
                  style={[styles.enableDropdown, {backgroundColor: '#fff'}]}
                  value={tooling}
                  onChangeText={setTooling}
                  placeholder="Enter tooling"
                />
              </View>
              <View style={styles.container}>
                <View style={styles.printingContainer}>
                  <Text style={styles.dropdownText1}>Printing Colors:</Text>

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

              {/* Material Usage for Each Paper Product - PRINTING PHASE */}
              <View style={styles.completionFieldsContainer}>
                <Text
                  style={[
                    styles.boldText,
                    {marginBottom: 10, fontSize: 16, width: '100%'},
                  ]}>
                  Job Completion Details - Printing Phase
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
                        style={[
                          styles.enableDropdown,
                          {backgroundColor: '#fff'},
                        ]}
                        value={paperItem.printing.used}
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
                        style={[
                          styles.enableDropdown,
                          {backgroundColor: '#fff'},
                        ]}
                        value={paperItem.printing.waste}
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
                        style={[
                          styles.enableDropdown,
                          {backgroundColor: '#fff'},
                        ]}
                        value={paperItem.printing.leftover}
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
                        style={[
                          styles.enableDropdown,
                          {backgroundColor: '#fff'},
                        ]}
                        value={paperItem.printing.wip}
                        onChangeText={text => {
                          const numericValue = text.replace(/[^0-9.]/g, '');
                          updateMaterialUsage(idx, 'wip', numericValue);
                        }}
                        placeholder="Enter WIP"
                        keyboardType="numeric"
                      />
                    </View>

                    {/* Divider between paper products */}
                    {idx < materialUsageData.length - 1 && (
                      <View style={styles.divider} />
                    )}
                  </View>
                ))}
              </View>

              {!isCompleted && (
                <View style={styles.btnContainer}>
                  <CustomButton
                    title={'Submit'}
                    style={styles.submitBtn}
                    onPress={handleSubmit}
                  />
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default OperatorCreateOrder;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  subContainer: {
    width: '100%',
    paddingVertical: 20,
  },
  dropdownContainer: {
    width: '100%',
    borderRadius: 10,
    marginTop: 20,
  },
  disabledDropdown: {
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    height: 40,
    width: '80%',
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
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  printingContainer: {
    width: '70%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  checkboxContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'center',
  },
  checkbox: {
    width: 15,
    height: 15,
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 14,
    fontFamily: 'Lato-Black',
    color: '#000',
    marginVertical: 10,
  },
  dropdownText1: {
    fontSize: 14,
    fontFamily: 'Lato-Black',
    color: '#000',
    marginVertical: 10,
  },
  checkmarkImage: {
    height: 20,
    width: 20,
  },
  checkboxText: {
    fontSize: 14,
    fontFamily: 'Lato-Regular',
    color: '#000',
  },
  colorAniloxMainContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: '#f0f0f0',
    padding: 20,
    borderRadius: 10,
  },
  colorAniloxRowContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    alignItems: 'center',
    marginVertical: 4,
  },
  colorAniloxText: {
    width: 100,
    alignItems: 'left',
    textAlign: 'left',
    fontSize: 16,
    fontFamily: 'Lato-Regular',
  },
  value: {
    fontSize: 14,
    color: '#000',
    fontFamily: 'Lato-Regular',
  },
  submitBtn: {
    marginVertical: 40,
    width: '100%',
  },
  btnContainer: {
    width: '100%',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    backgroundColor: '#ffffff',
    justifyContent: 'right',
    height: 37,
    width: '50%',
    color: '#000',
  },
  completionFieldsContainer: {
    marginTop: 15,
    marginBottom: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
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
