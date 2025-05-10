import React from "react";
import {View , Image , TextInput , StyleSheet} from 'react-native';


const SearchBar = ({placeholder,secureTextEntry, style ,value, onChangeText, ...props})=> (
    <View style={[styles.searchBarContainer, style]}>
        <Image style={styles.searchImg} source={require('../assets/images/searchImg.png')}/>
        <TextInput
        style={[styles.searchInputBox]}
        placeholder={placeholder}
        placeholderTextColor="#000"
        secureTextEntry={secureTextEntry}
        value={value}
        onChangeText={onChangeText}
        {...props}
      />
    </View>
)
export default SearchBar;

const styles = StyleSheet.create({
    searchBarContainer : {
        display:'flex',
        flexDirection:'row',
        alignItems:'center',
        backgroundColor:'#fff',
        height:50,
        paddingHorizontal:10,
        borderRadius:10
    },
    searchInputBox: {
      height: 50,
      width: '90%',
      borderRadius: 10,
      paddingHorizontal: 10,
      color: '#000',
      fontSize:16,
      fontFamily:'Lato-Regular'
    },
    searchImg : {
        height:20,
        width:20
    }
  });