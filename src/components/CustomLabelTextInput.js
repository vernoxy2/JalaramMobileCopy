import React from "react";
import {View , TextInput , Text , StyleSheet} from 'react-native';


const CustomLabelTextInput = ({label, inputStyle,value,onChangeText})=> {
    return (
        <View style={styles.customLabelTextInputContainer}>
            <Text style={styles.inputLabel}>{label}</Text>
            <TextInput 
            style={[styles.borderInput, inputStyle]} 
            value={value}
            onChangeText={onChangeText}
            />
        </View>
    )
}
export default CustomLabelTextInput;

const styles = StyleSheet.create ({
    customLabelTextInputContainer : {
        display : 'flex',
        flexDirection:'row',
        alignItems:'center',
        width:'100%',
        marginTop:20,
        justifyContent:'center'
    },
    borderInput : {
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        borderStyle:'solid',
        width:'65%',
        color:'#000',
        fontSize:14,
        padding:0
    },
    inputLabel :{
        width:'35%',
        fontSize:14,
        fontWeight:'medium'
    }
})