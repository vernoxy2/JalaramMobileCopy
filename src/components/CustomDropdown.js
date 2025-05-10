import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    FlatList,
    StyleSheet,
    Image,
} from 'react-native';

const CustomDropdown = ({ data, onSelect, placeholder, style , selectedText }) => {
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
                style={[styles.dropdown, style]}
                onPress={() => setVisible(true)}
            >
                <Text style={[styles.selectedText, selectedText]}>
                    {selected ? selected.label : placeholder}
                </Text>
                <Image
                    style={styles.dropdownImg}
                    source={
                        visible
                            ? require('../assets/images/dropUpImg.png')
                            : require('../assets/images/dropDownImg.png')
                    }
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
                                    <Text style={styles.label}>{item.label}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </>

    );
};

export default CustomDropdown;

const styles = StyleSheet.create({

    dropdown: {
        borderWidth: 1,
        borderColor: '#ccc',
        alignItems: "center",
        justifyContent: 'space-between',
        width: '40%',
        height: 40,
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'row',
        paddingHorizontal: 10
    },
    selectedText: {
        fontSize: 16,
        color: '#000',
        fontFamily:'Lato-Black'
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
        width: 20
    },
    label : {
        fontSize:14,
        color:'#555',
        fontFamily:'Lato-Regular'
    }
});
