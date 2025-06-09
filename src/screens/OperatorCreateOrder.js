import React, {useState, useEffect} from 'react';
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
  paperProductCode,
  printingPlateSize,
  slitting,
  teethSize,
  upsAcross,
  windingDirection,
} from '../constant/constant';
import CustomColorDropdown from '../components/CustomColorDropdown';
import CustomButton from '../components/CustomButton';
import firestore from '@react-native-firebase/firestore';
import CustomLabelTextInput from '../components/CustomLabelTextInput';
import CustomTextInput from '../components/CustomTextInput';

const OperatorCreateOrder = ({navigation, route}) => {
  const order = route?.params?.order || {};
  const [jobStarted, setJobStarted] = useState(order.jobStarted || false);

  const [selectedColor, setSelectedColor] = useState(null);

  const [size, setSize] = useState(order.jobSize || '');
  const [jobPaper, setJobPaper] = useState(order.jobPaper || '');
  const [paperProduct, setPaperProduct] = useState(
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

  useEffect(() => {
    // Check if `order` is available, if not return
    if (!order) return;

    // Directly use the `order` values to set form state
    setSize(order.jobSize || '');
    setJobPaper(order.jobPaper || '');
    setPaperProduct(order.paperProductCode || '');
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
  }, [order]); // Only trigger this when `order` changes

  const [colorAniloxValues, setColorAniloxValues] = useState({
    C: '',
    M: '',
    Y: '',
    K: '',
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
      const orderRef = firestore().collection('orders').doc(order.id);
      await orderRef.update({
        jobStarted: true,
        updatedAt: firestore.FieldValue.serverTimestamp(),
        jobSize: size,
        jobPaper,
        paperProductCode: paperProduct,
        paperProductNo,
        printingPlateSize: plateSize,
        upsAcross: upsAcrossValue,
        around: aroundValue,
        teethSize: teethSizeValue,
        blocks: blocksValue,
        windingDirection: windingDirectionValue,
        slitting: slittingValue,
        printingColors,
        varnish: checkboxState.box4 ? 'Uv' : '',
        checkedApproved: checkboxState.box5,
        colorAniloxValues,
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
      const orderRef = firestore().collection('orders').doc(order.id);

      await orderRef.update({
        jobPaper,
        runningMtr: runningMtrValue,
        jobStatus: 'Punching',
        assignedTo: 'Kt1bJQzaUPdAowP7bTpdNQEfXKO2',
      });

      alert('Job successfully updated and reassigned!');
      navigation.goBack();
    } catch (err) {
      console.error('Error updating order:', err);
      alert('Failed to update order');
    }
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
              <CustomDropdown
                placeholder={'Paper Product Code'}
                data={paperProductCode}
                style={styles.dropdownContainer}
                selectedText={styles.dropdownText}
                onSelect={item => setPaperProduct(item)}
                showIcon={true}
              />

              <CustomTextInput
                placeholder="Paper Product No"
                value={paperProductNo}
                onChangeText={setPaperProductNo}
              />

              <View>
                {order.printingColors && order.printingColors.length > 0 && (
                  <View style={styles.selectedColorsContainer}>
                    <Text style={styles.selectedColorsTitle}>
                      Selected Printing Colors:
                    </Text>
                    {order.printingColors.map(color => (
                      <Text key={color} style={styles.selectedColor}>
                        • {color}
                      </Text>
                    ))}
                  </View>
                )}
              </View>

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
              <View style={styles.detailsRowContainer}>
                <Text style={styles.boldText}>Job Paper:</Text>
                <View style={styles.disabledDropdown}>
                  <Text style={styles.value}>{jobPaper.label}</Text>
                </View>
              </View>
              <View style={styles.detailsRowContainer}>
                <Text style={styles.boldText}>Job Size</Text>
                <TextInput
                  style={styles.sizeInput}
                  value={size}
                  onChangeText={setSize}
                  editable={false}
                />
              </View>

              <View style={styles.detailsRowContainer}>
                <Text style={styles.boldText}>Printing Plate Size:</Text>
                <View style={styles.disabledDropdown}>
                  <Text style={styles.value}>{plateSize.label}</Text>
                </View>
              </View>

              <View style={styles.detailsRowContainer}>
                <Text style={styles.boldText}>Ups : Across</Text>
                <View style={styles.disabledDropdown}>
                  <Text style={styles.value}>{upsAcrossValue.label}</Text>
                </View>
              </View>

              <View style={styles.detailsRowContainer}>
                <Text style={styles.boldText}>Around:</Text>
                <View style={styles.disabledDropdown}>
                  <Text style={styles.value}>{aroundValue.label}</Text>
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
              <View style={styles.detailsRowContainer}>
                <Text style={styles.boldText}>Tooling</Text>
                <View style={styles.disabledDropdown}>
                  <Text style={styles.value}>{tooling}</Text>
                </View>
              </View>

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
                  <Text style={styles.colorAniloxText}>Sq1</Text>
                  <CustomColorDropdown
                    data={colorAnilox}
                    onSelect={item => handleColorSelect('Sq1', item)}
                  />
                </View>

                <View style={styles.colorAniloxRowContainer}>
                  <Text style={styles.colorAniloxText}>Sq2</Text>
                  <CustomColorDropdown
                    data={colorAnilox}
                    onSelect={item => handleColorSelect('Sq2', item)}
                  />
                </View>

                <View style={styles.colorAniloxRowContainer}>
                  <Text style={styles.colorAniloxText}>Sq3</Text>
                  <CustomColorDropdown
                    data={colorAnilox}
                    onSelect={item => handleColorSelect('Sq3', item)}
                  />
                </View>

                <View style={styles.colorAniloxRowContainer}>
                  <Text style={styles.colorAniloxText}>Sq4</Text>
                  <CustomColorDropdown
                    data={colorAnilox}
                    onSelect={item => handleColorSelect('Sq4', item)}
                  />
                </View>
              </View>

              <CustomTextInput
                placeholder={'Running Mtrs'}
                style={styles.input}
                value={runningMtrValue}
                onChangeText={setRunningMtrValue}
              />

              <View style={styles.btnContainer}>
                <CustomButton
                  title={'Submit'}
                  style={styles.submitBtn}
                  onPress={handleSubmit}
                />
              </View>
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

    height: 40,
    justifyContent: 'space-between',

    paddingHorizontal: 20,
  },
  disabledDropdown: {
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
    width: '70%',
    alignItems: 'center',
  },
  colorAniloxText: {
    width: 70,
    alignItems: 'center',
    textAlign: 'center',
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
    width: '100%',
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
});
