import React from 'react';
import {View, Image, Text, StyleSheet, Pressable} from 'react-native';
import CustomButton from './CustomButton';
import CustomDropdown from './CustomDropdown';
import SearchBar from './SearchBar';
import { useNavigation } from '@react-navigation/native';

const CustomHeader = ({
  showHeadingTextContainer = false,
  showHeadingSection2Container = false,
  headingTitle,
  btnHeading,
  showHeaderBtn = false,
  showHeaderDropDown = false,
  showHeaderSearchBar = false,
  onPress,
  showHeadingSection1Container = false,
  showBackBtn ,
  onDropdownSelect
}) => {
  const options = [
    {label: 'All Jobs', value: 'allJobs'},
    {label: 'Printing', value: 'printingJobs'},
    {label: 'Punching', value: 'punchingJobs'},
    {label: 'Slitting ', value: 'slittingJobs'},
    {label: 'Pending ', value: 'Pending'},
    {label: 'Completed ', value: 'completed'},
  ];

  const navigation = useNavigation();

  const handleSelect = item => {
    console.log('Selected:', item);
    onDropdownSelect?.(item.value);
  };

  return (
    <View style={styles.loginTopContainer}>
{
    showHeadingSection1Container && (
        <View style={styles.headingSection1Container}>
{
    showBackBtn ? (
        <Pressable onPress={()=>navigation.goBack()}>
        <Image
          style={styles.backBtnImg}
          source={require('../assets/images/backArrow.png')}
        />
        </Pressable>

    ) : (
        <View/>
    )
}
        {showHeadingTextContainer && (
          <View style={styles.headingTextContainer}>
            <Text style={styles.headingText}>{headingTitle}</Text>
          </View>
        )}

        <View></View>
      </View>

    )
}
      {showHeadingSection2Container && (
        <View style={styles.headingSection2Container}>
          {
          showHeaderBtn ? (
            <CustomButton
              style={styles.btnContainer}
              title={btnHeading}
              textStyle={styles.btnText}
              onPress={onPress}
            />
          ) : (
            <View></View>
          )} 

          {showHeaderDropDown && (
            <CustomDropdown
              data={options}
              onSelect={handleSelect}
              placeholder={'All Jobs'}
              showIcon={true}
            />
          )}
          {showHeaderSearchBar && <SearchBar placeholder={'Search Job'} />}
        </View>
      )}
    </View>
  );
};

export default CustomHeader;

const styles = StyleSheet.create({
  loginTopContainer: {
    height: '25%',
    backgroundColor: '#3668B1',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  loginScreenImg: {
    height: 270,
    width: 270,
    resizeMode: 'contain',
    marginTop: -110,
  },
  loginText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  headingSection1Container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  headingTextContainer: {
    backgroundColor: '#fff',
    padding: 10,
  },
  headingText: {
    fontSize: 20,
    fontFamily:'Lato-Black'
  },
  backBtnImg: {
    height: 20,
    width: 20,
  },
  btnContainer: {
    height: 40,
    borderRadius: 0,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    width: '40%',
  },
  btnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'medium',
  },
  headingSection2Container: {
    width: '90%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    height: 70,
  },
});
