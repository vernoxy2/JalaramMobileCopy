import React from 'react';
import {View, Text, ScrollView, StyleSheet} from 'react-native';
import CustomHeader from '../components/CustomHeader';
import CustomLabelTextInput from '../components/CustomLabelTextInput';
import CustomButton from '../components/CustomButton';
import CustomLabelText from '../components/CustomLabelText';

const NotificationScreen = () => {
  return (
    <View style={styles.mainContainer}>
      <CustomHeader
      showHeadingSection1Container={true}
        headingTitle={'Flexo Job Card'}
        showHeadingSection2Container={true}
        showHeadingTextContainer={true}
        showBackBtn={true}
      />
      <ScrollView>
        <View style={styles.subContainer}>
          <View style={styles.cardBox}>
            <CustomLabelText label={'Job Card No :'} Details={'3214'} />
            <CustomLabelText label={'Job Name :'} Details={'Pan Mukhvas'} />
            <CustomLabelText label={'Job Date :'} Details={'25-08-2024'} />
            <CustomLabelText label={'Job Time :'} Details={'04 : 57'} />
            <CustomButton style={styles.btnContainer} title={'Accept'} />
          </View>

          <View style={styles.cardBox}>
            <CustomLabelText label={'Job Card No :'} Details={'3214'} />
            <CustomLabelText label={'Job Name :'} Details={'Pan Mukhvas'} />
            <CustomLabelText label={'Job Date :'} Details={'25-08-2024'} />
            <CustomLabelText label={'Job Time :'} Details={'04 : 57'} />
            <CustomButton style={styles.btnContainer} title={'Accept'} />
          </View>

          <View style={styles.cardBox}>
            <CustomLabelText label={'Job Card No :'} Details={'3214'} />
            <CustomLabelText label={'Job Name :'} Details={'Pan Mukhvas'} />
            <CustomLabelText label={'Job Date :'} Details={'25-08-2024'} />
            <CustomLabelText label={'Job Time :'} Details={'04 : 57'} />
            <CustomButton style={styles.btnContainer} title={'Accept'} />
          </View>

          <View style={styles.cardBox}>
            <CustomLabelText label={'Job Card No :'} Details={'3214'} />
            <CustomLabelText label={'Job Name :'} Details={'Pan Mukhvas'} />
            <CustomLabelText label={'Job Date :'} Details={'25-08-2024'} />
            <CustomLabelText label={'Job Time :'} Details={'04 : 57'} />
            <CustomButton style={styles.btnContainer} title={'Accept'} />
          </View>
          <View style={styles.cardBox}>
            <CustomLabelText label={'Job Card No :'} Details={'3214'} />
            <CustomLabelText label={'Job Name :'} Details={'Pan Mukhvas'} />
            <CustomLabelText label={'Job Date :'} Details={'25-08-2024'} />
            <CustomLabelText label={'Job Time :'} Details={'04 : 57'} />
            <CustomButton style={styles.btnContainer} title={'Accept'} />
          </View>

          <View style={styles.cardBox}>
            <CustomLabelText label={'Job Card No :'} Details={'3214'} />
            <CustomLabelText label={'Job Name :'} Details={'Pan Mukhvas'} />
            <CustomLabelText label={'Job Date :'} Details={'25-08-2024'} />
            <CustomLabelText label={'Job Time :'} Details={'04 : 57'} />
            <CustomButton  style={styles.btnContainer} title={'Accept'} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};
export default NotificationScreen;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  subContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  cardBox: {
    width: '100%',
    backgroundColor: '#f6f6f6',
    borderRadius: 10,
    alignItems: 'center',
    padding: 20,
    marginVertical:20
  },
  btnContainer: {
    width: '60%',
    marginTop: 20,
    backgroundColor:'#4ed966'
  },
});
