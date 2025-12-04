import React from 'react';
import {View, TextInput, Text, StyleSheet} from 'react-native';

const JobOriginalSizeInput = ({
  label = 'Job Original Size :',
  lengthValue,
  widthValue,
  onLengthChange,
  onWidthChange,
}) => {
  return (
    <View style={styles.customLabelRow}>
      <Text style={styles.inputLabel}>{label}</Text>

      <View style={styles.sizeInputWrapper}>
        <TextInput
          style={styles.sizeInput}
          placeholder="Length"
          placeholderTextColor="#999"
          keyboardType="decimal-pad"
          value={lengthValue}
          onChangeText={onLengthChange}
        />

        <Text style={styles.multiplySign}>×</Text>

        <TextInput
          style={styles.sizeInput}
          placeholder="Width"
          placeholderTextColor="#999"
          keyboardType="decimal-pad"
          value={widthValue}
          onChangeText={onWidthChange}
        />
      </View>
    </View>
  );
};

export default JobOriginalSizeInput;

const styles = StyleSheet.create({
  customLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  inputLabel: {
    width: '35%',
    fontSize: 14,
    fontWeight: 'medium',
  },
  sizeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '65%',
    justifyContent: 'space-between',
  },
  sizeInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingVertical: 5,
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
  },
  multiplySign: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 8,
    color: '#000',
  },
});
