import React from "react";
import {View , TextInput , Text , StyleSheet} from 'react-native';


const CustomLabelText = ({label, Details})=> {
    return (
        <View style={styles.customLabelTextContainer}>
            <Text style={styles.detailsLabel}>{label}</Text>
            <Text style={styles.borderText} >{Details}</Text>
        </View>
    )
}
export default CustomLabelText;

const styles = StyleSheet.create ({
    customLabelTextContainer : {
        display : 'flex',
        flexDirection:'row',
        alignItems:'center',
        width:'100%',
        marginTop:20,
        justifyContent:'center'
    },
    borderText : {
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        borderStyle:'solid',
        width:'65%',
        color:'#000',
        fontSize:14
    },
    detailsLabel :{
        width:'35%',
        fontSize:14,
        fontWeight:'medium'
    }
})