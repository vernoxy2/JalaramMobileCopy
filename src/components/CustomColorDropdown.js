import React, { useState } from 'react';
import {
  View,
  Modal,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
} from 'react-native';

const CustomColorDropdown = ({ data, onSelect }) => {
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState(null); // To store the selected item

  const handleSelect = (item) => {
    setSelected(item);  // Update the selected item state
    onSelect(item);      // Pass the selected item to the parent component
    setVisible(false);   // Close the dropdown
  };

  return (
    <>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setVisible(true)}
      >
        {selected ? (  // Check if an item is selected
          <Text style={styles.selectedText}>{selected.label}</Text>  // Show the selected label
        ) : (
          <Image
            style={styles.dropdownImg}
            source={require('../assets/images/dropDownImg.png')}  // Show the dropdown icon
          />
        )}
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={visible}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setVisible(false)}
          activeOpacity={1}
        >
          <View style={styles.modalContent}>
            <FlatList
              data={data}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => handleSelect(item)}  // Select item when clicked
                >
                  <Text>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  dropdown: {

    width: '30%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    // paddingHorizontal: 10,
  },
  selectedText: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'medium',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    marginHorizontal: 40,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    maxHeight: '50%',
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderColor: '#ddd',
  },
  dropdownImg: {
    height: 20,
    width: 20,
  },
});

export default CustomColorDropdown;
