import React, { useState } from 'react';
import {View, Text, StyleSheet} from 'react-native';
import CustomColorDropdown from '../components/CustomColorDropdown';
import {machine} from '../constant/constant';
import CustomHeader from '../components/CustomHeader';
import CustomLabelTextInput from '../components/CustomLabelTextInput';
import CustomButton from '../components/CustomButton';

const MachineTestScreen = () => {

    const [selectedMachine , setSelectedMachine] = useState(null);

    const handleSelectMachine = item => {
        setSelectedMachine(item)
    }

  return (
    <View style={styles.mainContainer}>
      <CustomHeader
        showHeadingSection1Container={true}
        showBackBtn={true}
        showHeadingSection2Container={true}
        showHeadingTextContainer={true}
        headingTitle={'Machine Test'}
      />
      
    <View style={styles.subContainer}>
    <Text>Machine name</Text>
      <View style={styles.machineRowContainer}>
        <Text>Rk</Text>
        <CustomColorDropdown 
        data={machine} 
        onSelect={handleSelectMachine}
        />
      </View>
      <CustomLabelTextInput 
      label={'Operator Name :'}
      inputStyle={styles.inputStyle}
      />
      <CustomLabelTextInput 
      label={'Running meters :'}
      inputStyle={styles.inputStyle}
      />

      <CustomButton 
      title={'Submit'}
      style={styles.btnContainer}
      
      />
    </View>

    </View>
  );
};
export default MachineTestScreen;

const styles = StyleSheet.create({
  machineRowContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width:"80%"
  },
  mainContainer: {
    height: '100%',
    width: '100%',
    backgroundColor: '#fff',
  },
  subContainer : {
    width:'100%',
    padding:20,
    alignItems:'center'
  },
  inputStyle : {
    borderWidth: 1,
    borderColor: '#000',
    borderStyle:'solid',
    width:'65%',
    color:'#000',
    fontSize:14,
    padding:10
    
  },
  btnContainer : {
    width:'100%',
    marginVertical:20
  }
});
