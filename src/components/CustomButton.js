import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

const CustomButton = ({ title, onPress, style, textStyle }) => (
  <Pressable style={[styles.button, style]} onPress={onPress}>
    <Text style={[styles.buttonText, textStyle]}>{title}</Text>
  </Pressable>
);

export default CustomButton;

const styles = StyleSheet.create({
  button: {
    height: 60,
    width: '90%',
    borderRadius: 10,
    backgroundColor: '#3668B1',
    justifyContent: 'center',
    alignItems: 'center',
   
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily:"Lato-Black"
  },
});


