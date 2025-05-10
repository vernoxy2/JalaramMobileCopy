import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
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

const OperatorCreateOrder = ({navigation, route}) => {
  const order = route?.params?.order || {};

  const [selectedColor, setSelectedColor] = useState(null);

  const [size, setSize] = useState(order.jobSize || '');
  const [jobPaper, setJobPaper] = useState(order.jobPaper || '');
  const [paperProduct, setPaperProduct] = useState(
    order.paperProductCode || '',
  );
  const [plateSize, setPlateSize] = useState(order.printingPlateSize || '');
  const [upsAcrossValue, setUpsAcrossValue] = useState('');
  const [aroundValue, setAroundValue] = useState('');
  const [teethSizeValue, setTeethSizeValue] = useState('');
  const [blocksValue, setBlocksValue] = useState('');
  const [windingDirectionValue, setWindingDirectionValue] = useState('');
  const [slittingValue, setSlittingValue] = useState('');

  const [checkboxState, setCheckboxState] = useState({
    box1: order.printingColors?.includes('Uv') || false,
    box2: order.printingColors?.includes('Water') || false,
    box3: order.printingColors?.includes('Special') || false,
    box4: order.varnish === 'Uv',
    box5: order.checkedApproved || false,
  });

  // useEffect(() => {
  //   const fetchPreviousJobData = async () => {
  //     if (!order?.jobName) return;

  //     try {
  //       const snapshot = await firestore()
  //         .collection('orders')
  //         .where('jobName', '==', order.jobName)
  //         .orderBy('createdAt')
  //         .limit(1)
  //         .get();

  //       if (!snapshot.empty) {
  //         const prevJob = snapshot.docs[0].data();

  //         setSize(prevJob.jobSize || '');
  //         setJobPaper(prevJob.jobPaper || '');
  //         setPaperProduct(prevJob.paperProductCode || '');
  //         setPlateSize(prevJob.printingPlateSize || '');
  //         setCheckboxState({
  //           box1: prevJob.printingColors?.includes('Uv') || false,
  //           box2: prevJob.printingColors?.includes('Water') || false,
  //           box3: prevJob.printingColors?.includes('Special') || false,
  //           box4: prevJob.varnish === 'Uv',
  //           box5: prevJob.checkedApproved || false,
  //         });

  //         // Optionally: Preselect dropdown values (if CustomDropdown supports initial values)
  //       }
  //     } catch (error) {
  //       console.error('Error fetching previous job data:', error);
  //     }
  //   };

  //   fetchPreviousJobData();
  // }, [order?.jobName]);

  useEffect(() => {
    // Check if `order` is available, if not return
    if (!order) return;

    // Directly use the `order` values to set form state
    setSize(order.jobSize || '');
    setJobPaper(order.jobPaper || '');
    setPaperProduct(order.paperProductCode || '');
    setPlateSize(order.printingPlateSize || '');
    setCheckboxState({
      box1: order.printingColors?.includes('Uv') || false,
      box2: order.printingColors?.includes('Water') || false,
      box3: order.printingColors?.includes('Special') || false,
      box4: order.varnish === 'Uv',
      box5: order.checkedApproved || false,
    });
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

 

  const handleSubmit = async () => {
    try {
      const printingColors = [];
      if (checkboxState.box1) printingColors.push('Uv');
      if (checkboxState.box2) printingColors.push('Water');
      if (checkboxState.box3) printingColors.push('Special');

      const orderRef = firestore().collection('orders').doc(order.id);

      await orderRef.update({
        jobSize: size,
        jobPaper,
        paperProductCode: paperProduct,
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
        jobStatus: 'punching',
        assignedTo: 'WmUWJ2o8f6T3uy5w5HVaHM4au3A2',
        updatedAt: firestore.FieldValue.serverTimestamp(),
        colorAniloxValues,
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
          <CustomDropdown
            placeholder={'Job Paper / Fill Material'}
            data={options}
            style={styles.dropdownContainer}
            selectedText={styles.dropdownText}
            onSelect={item => setJobPaper(item)}
          />

          {/* <View style={styles.sizeMainContainer}>
            <Text style={styles.sizeText}>Size</Text>
            <TextInput style={styles.sizeInput} />
          </View> */}

          <View style={styles.sizeMainContainer}>
            <Text style={styles.sizeText}>Size</Text>
            <TextInput
              style={styles.sizeInput}
              value={size}
              onChangeText={setSize}
            />
          </View>

          <CustomDropdown
            placeholder={'Paper Product Code'}
            data={paperProductCode}
            style={styles.dropdownContainer}
            selectedText={styles.dropdownText}
            onSelect={item => setPaperProduct(item)}
          />

          <CustomDropdown
            placeholder={'Printing Plate Size'}
            data={printingPlateSize}
            style={styles.dropdownContainer}
            selectedText={styles.dropdownText}
            onSelect={item => setPlateSize(item)}
          />

<CustomDropdown
  placeholder={'Ups : Across'}
  data={upsAcross}
  style={styles.dropdownContainer}
  selectedText={styles.dropdownText}
  onSelect={item => setUpsAcrossValue(item)}
/>

<CustomDropdown
  placeholder={'Around'}
  data={around}
  style={styles.dropdownContainer}
  selectedText={styles.dropdownText}
  onSelect={item => setAroundValue(item)}
/>

<CustomDropdown
  placeholder={'Teeth Size'}
  data={teethSize}
  style={styles.dropdownContainer}
  selectedText={styles.dropdownText}
  onSelect={item => setTeethSizeValue(item)}
/>

<CustomDropdown
  placeholder={'Blocks'}
  data={blocks}
  style={styles.dropdownContainer}
  selectedText={styles.dropdownText}
  onSelect={item => setBlocksValue(item)}
/>
<CustomDropdown
  placeholder={'Winding Direction'}
  data={windingDirection}
  style={styles.dropdownContainer}
  selectedText={styles.dropdownText}
  onSelect={item => setWindingDirectionValue(item)}
/>

<CustomDropdown
  placeholder={'Slitting'}
  data={slitting}
  style={styles.dropdownContainer}
  selectedText={styles.dropdownText}
  onSelect={item => setSlittingValue(item)}
/>

          <View style={styles.container}>
            <View style={styles.printingContainer}>
              <Text style={styles.dropdownText}>Printing Colours :</Text>

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => handleCheckboxChange('box1')}>
                <View
                  style={[
                    styles.checkbox,
                    checkboxState.box1 && styles.checked,
                  ]}>
                  {checkboxState.box1 && (
                    <Image
                      style={styles.checkmarkImage}
                      source={require('../assets/images/check.png')}
                    />
                  )}
                </View>
                <Text style={styles.checkboxText}>{'Uv'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => handleCheckboxChange('box2')}>
                <View
                  style={[
                    styles.checkbox,
                    checkboxState.box2 && styles.checked,
                  ]}>
                  {checkboxState.box2 && (
                    <Image
                      style={styles.checkmarkImage}
                      source={require('../assets/images/check.png')}
                    />
                  )}
                </View>
                <Text style={styles.checkboxText}>{'Water'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => handleCheckboxChange('box3')}>
                <View
                  style={[
                    styles.checkbox,
                    checkboxState.box3 && styles.checked,
                  ]}>
                  {checkboxState.box3 && (
                    <Image
                      style={styles.checkmarkImage}
                      source={require('../assets/images/check.png')}
                    />
                  )}
                </View>
                <Text style={styles.checkboxText}>{'Special'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.varnishContainer}>
              <Text style={styles.dropdownText}>Varnish :</Text>

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => handleCheckboxChange('box4')}>
                <View
                  style={[
                    styles.checkbox,
                    checkboxState.box4 && styles.checked,
                  ]}>
                  {checkboxState.box4 && (
                    <Image
                      style={styles.checkmarkImage}
                      source={require('../assets/images/check.png')}
                    />
                  )}
                </View>
                <Text style={styles.checkboxText}>{'Uv'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.checkedApprovedContainer}>
            <Text style={styles.checkedApprovedTxt}>
              Checked with approved Sample / Artwork :{' '}
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => handleCheckboxChange('box5')}>
                <View
                  style={[
                    styles.checkbox,
                    checkboxState.box5 && styles.checked,
                  ]}>
                  {checkboxState.box5 && (
                    <Image
                      style={styles.checkmarkImage}
                      source={require('../assets/images/check.png')}
                    />
                  )}
                </View>
              </TouchableOpacity>
            </Text>
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
              <Text style={styles.colorAniloxText}>Others</Text>
              <CustomColorDropdown
                data={colorAnilox}
                onSelect={item => handleColorSelect('Others', item)}
              />
            </View>
          </View>

          <View style={styles.btnContainer}>
            <CustomButton
              title={'Submit'}
              style={styles.submitBtn}
              onPress={handleSubmit}
            />
          </View>
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
  sizeMainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  sizeInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    width: '70%',
    fontSize: 14,
    fontWeight: 'medium',
    color: '#000',
  },
  
  sizeText: {
    fontSize: 14,
    fontFamily:'Lato-Black',
    color: '#000',

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
    fontFamily:'Lato-Black',
    color: '#000',
  },
  checkmarkImage: {
    height: 20,
    width: 20,
  },
  checkboxText: {
    fontSize: 14,
    fontFamily:'Lato-Regular',
    color: '#000',
  },
  checkboxLabel: {
    fontSize: 10,
  },
  checkedApprovedTxt: {
    fontSize: 20,
    fontFamily:'Lato-Black',
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
    fontFamily:'Lato-Regular'
  },
  submitBtn: {
    marginVertical: 40,
    width: '100%',
  },
  btnContainer: {
    width: '100%',
    alignItems: 'center',
  },
});
