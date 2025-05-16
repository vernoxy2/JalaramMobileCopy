import React from 'react';
import { TextInput, StyleSheet } from 'react-native';

const CustomTextInput = ({ placeholder, secureTextEntry,value, onChangeText, style, ...props }) => (
  <TextInput
    style={[styles.input, style]}
    placeholder={placeholder}
    placeholderTextColor="#000"
    value={value}
    onChangeText={onChangeText}
    secureTextEntry={secureTextEntry}
    {...props}
  />
);

const styles = StyleSheet.create({
  input: {
    height: 50,
    width: '90%',
    backgroundColor: '#f6f6f6',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginTop: 35,
    color: '#000',
    fontFamily:'Lato-Regular'
  },
});

export default CustomTextInput;
