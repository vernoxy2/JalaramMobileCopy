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

const CustomColorDropdown = ({ data, onSelect, placeholder = 'Select Value' }) => {
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState(null);

  const handleSelect = (item) => {
    setSelected(item);
    onSelect(item);
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setVisible(true)}
      >
        {selected ? (
          <Text style={styles.selectedText}>{selected.label}</Text>
        ) : (
          <Text style={styles.placeholderText}>{placeholder}</Text>
        )}
        <Image
          style={styles.dropdownImg}
          source={require('../assets/images/dropDownImg.png')}
        />
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
                  onPress={() => handleSelect(item)}
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
    width: '50%',
    height: 35,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  selectedText: {
    fontSize: 16,
    color: '#000',
  },
  placeholderText: {
    fontSize: 14,
    color: '#999', // lighter color for placeholder
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
    height: 15,
    width: 18,
    tintColor: '#666',
  },
});

export default CustomColorDropdown;

