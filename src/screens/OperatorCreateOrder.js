import React, {useState, useEffect, use} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Pressable,
} from 'react-native';
import CustomHeader from '../components/CustomHeader';
import CustomDropdown from '../components/CustomDropdown';
import {
  around,
  blocks,
  colorAnilox,
  options,
  paperProductCodeData,
  printingPlateSize,
  slitting,
  teethSize,
  upsAcross,
  windingDirection,
} from '../constant/constant';
import CustomColorDropdown from '../components/CustomColorDropdown';
import CustomButton from '../components/CustomButton';
import firestore, {or} from '@react-native-firebase/firestore';
import CustomLabelTextInput from '../components/CustomLabelTextInput';
import CustomTextInput from '../components/CustomTextInput';
import auth from '@react-native-firebase/auth';
import {Alert} from 'react-native';

const OperatorCreateOrder = ({navigation, route}) => {
  // const order = route?.params?.order || {};
  const order = React.useMemo(
    () => route?.params?.order || {},
    [route?.params?.order],
  );
  const [jobStarted, setJobStarted] = useState(order.jobStarted || false);
  const [selectedColor, setSelectedColor] = useState(null);
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
  const [slittingValue, setSlittingValue] = useState('');
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
  const [usedByPrint, setUsedByPrint] = useState('');
  const [wasteByPrint, setWasteByPrint] = useState('');
  const [leftoverByPrint, setLeftoverByPrint] = useState('');
  const [wipByPrint, setWipByPrint] = useState('');

  const printingColors = [];
  if (checkboxState.box1) printingColors.push('Uv');
  if (checkboxState.box2) printingColors.push('Water');
  if (checkboxState.box3) printingColors.push('Special');

  useEffect(() => {
    // Check if `order` is available, if not return
    if (!order) return;
    // Directly use the `order` values to set form state
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
  }, [order]); // Only trigger this when `order` changes

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

  const handleSelect = item => {
    console.log('Selected:', item);
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

      const orderRef = firestore().collection('orders').doc(order.id);
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
        slitting: slittingValue,
        // printingColors,
        varnish: checkboxState.box4 ? 'Uv' : '',
        checkedApproved: checkboxState.box5,
        // colorAniloxValues,
      });

      setJobStarted(true);
      alert('Job started successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error starting job:', error);
      alert('Failed to start job');
    }
  };

  const handleSubmit = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }
      // Validate material fields
    if (!usedByPrint || !wasteByPrint || !leftoverByPrint || !wipByPrint) {
      Alert.alert('Missing Data', 'Please fill all material usage fields');
      return;
    }
      const orderRef = firestore().collection('orders').doc(order.id);

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
        usedByPrint,
        wasteByPrint,
        leftoverByPrint,
        wipByPrint,
      });
      alert('Job successfully updated and reassigned!');
      setTimeout(() => {
        navigation.goBack();
      }, 500);
    } catch (err) {
      console.error('Error updating order:', err);
      alert('Failed to update order');
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

              {/* Extra paper product pairs */}
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

              {/* <CustomTextInput
                placeholder={'Running Mtrs'}
                style={styles.input}
                value={runningMtrValue}
                onChangeText={setRunningMtrValue}
              /> */}
              <View style={styles.detailsRowContainer}>
                <Text style={styles.boldText}>Running Mtrs</Text>
                <TextInput
                  style={[styles.enableDropdown, {backgroundColor: '#fff'}]}
                  value={runningMtrValue}
                  // onChangeText={setRunningMtrValue}
                  onChangeText={text => {
                    // Allow only digits (0–9)
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
              {/* NEW SECTION: Job Completion Fields */}
              <View style={styles.completionFieldsContainer}>
                <Text
                  style={[styles.boldText, {marginBottom: 10, fontSize: 16, width: '100%'}]}>
                  Job Completion Details
                </Text>

                <View style={styles.detailsRowContainer}>
                  <Text style={styles.boldText}>Used</Text>
                  <TextInput
                    style={[styles.enableDropdown, {backgroundColor: '#fff'}]}
                    value={usedByPrint}
                    onChangeText={text => {
                      const numericValue = text.replace(/[^0-9.]/g, '');
                      setUsedByPrint(numericValue);
                    }}
                    placeholder="Enter Used"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.detailsRowContainer}>
                  <Text style={styles.boldText}>Waste</Text>
                  <TextInput
                    style={[styles.enableDropdown, {backgroundColor: '#fff'}]}
                    value={wasteByPrint}
                    onChangeText={text => {
                      const numericValue = text.replace(/[^0-9.]/g, '');
                      setWasteByPrint(numericValue);
                    }}
                    placeholder="Enter Waste"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.detailsRowContainer}>
                  <Text style={styles.boldText}>Leftover (LO)</Text>
                  <TextInput
                    style={[styles.enableDropdown, {backgroundColor: '#fff'}]}
                    value={leftoverByPrint}
                    onChangeText={text => {
                      const numericValue = text.replace(/[^0-9.]/g, '');
                      setLeftoverByPrint(numericValue);
                    }}
                    placeholder="Enter Leftover"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.detailsRowContainer}>
                  <Text style={styles.boldText}>WIP</Text>
                  <TextInput
                    style={[styles.enableDropdown, {backgroundColor: '#fff'}]}
                    value={wipByPrint}
                    onChangeText={text => {
                      const numericValue = text.replace(/[^0-9.]/g, '');
                      setWipByPrint(numericValue);
                    }}
                    placeholder="Enter WIP"
                    keyboardType="numeric"
                  />
                </View>
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
  sizeInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    width: '80%',
    fontSize: 14,
    fontWeight: 'medium',
    color: '#000',
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
  varnishContainer: {
    width: '25%',
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
  checkboxLabel: {
    fontSize: 10,
  },
  checkedApprovedTxt: {
    fontSize: 20,
    fontFamily: 'Lato-Black',
    color: '#000',
    width: '100%',
  },
  checkedApprovedContainer: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    marginTop: 20,
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

  selectedColorsContainer: {
    marginTop: 20,
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
  },
  selectedColorsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  selectedColor: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  completionFieldsContainer: {
    marginTop: 15,
    marginBottom: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});
