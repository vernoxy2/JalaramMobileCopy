import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Button,
  Alert,
  Pressable,
  TextInput,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import CustomHeader from '../components/CustomHeader';
import CustomButton from '../components/CustomButton';

const SlittingJobDetailsScreen = ({route, navigation}) => {
  const {order} = route.params;

  const [inputs, setInputs] = useState([{A: '', B: '', C: ''}]);
  const [totalA, setTotalA] = useState(0);
  const [totalB, setTotalB] = useState(0);
  const [totalC, setTotalC] = useState(0);

  useEffect(() => {
    let sumA = 0,
      sumB = 0,
      sumC = 0;
    inputs.forEach(input => {
      const A = parseFloat(input.A) || 0;
      const B = parseFloat(input.B) || 0;
      const C = parseFloat(input.C) || 0;
      sumA += A;
      sumB += B;
      sumC += C;
    });
    setTotalA(sumA);
    setTotalB(sumB);
    setTotalC(sumC);
  }, [inputs]);

  const addInputField = () => {
    setInputs([...inputs, {A: '', B: '', C: ''}]);
  };

  const handleInputChange = (text, index, field) => {
    const updatedInputs = [...inputs];
    updatedInputs[index][field] = text;

    if (field === 'A' || field === 'B') {
      const A = parseFloat(updatedInputs[index].A) || 0;
      const B = parseFloat(updatedInputs[index].B) || 0;
      updatedInputs[index].C = (A * B).toString();
    }

    setInputs(updatedInputs);
  };

  const handleComplete = async () => {
    try {
      await firestore().collection('orders').doc(order.id).update({
        jobStatus: 'completed',
        assignedTo: 'adminUID', // Replace with actual admin's UID
        endTime: firestore.FieldValue.serverTimestamp(),
        slittingData: inputs,
      });
      Alert.alert('Success', 'Job completed ');
      navigation.goBack();
    } catch (error) {
      console.error('Error completing job:', error);
      Alert.alert('Error', 'Failed to complete job');
    }
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        showHeadingSection1Container={true}
        showBackBtn={true}
        showHeadingTextContainer={true}
        headingTitle={'Job Details'}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Job Card No:</Text>
        <Text style={styles.value}>{order.jobCardNo}</Text>

        <Text style={styles.label}>Customer Name:</Text>
        <Text style={styles.value}>{order.customerName}</Text>

        <Text style={styles.label}>Job Date:</Text>
        <Text style={styles.value}>{order.jobDate}</Text>

        <Text style={styles.label}>Job Status:</Text>
        <Text style={styles.value}>{order.jobStatus}</Text>

        <Pressable style={styles.addButton} onPress={addInputField}>
          <Text style={styles.buttonText}>Add Row</Text>
        </Pressable>

        {inputs.map((input, index) => (
          <View key={index} style={styles.row}>
            <TextInput
              style={styles.textInput}
              value={input.A}
              placeholder="A"
              keyboardType="numeric"
              onChangeText={text => handleInputChange(text, index, 'A')}
            />
            <Text>*</Text>
            <TextInput
              style={styles.textInput}
              value={input.B}
              placeholder="B"
              keyboardType="numeric"
              onChangeText={text => handleInputChange(text, index, 'B')}
            />
            <Text>=</Text>
            <TextInput
              style={styles.textInput}
              value={input.C}
              editable={false}
              placeholder="C"
            />
          </View>
        ))}

        <View style={styles.row}>
          <TextInput
            style={styles.textInput}
            value={totalA.toString()}
            editable={false}
          />
          <TextInput
            style={styles.textInput}
            value={totalB.toString()}
            editable={false}
          />
          <TextInput
            style={styles.textInput}
            value={totalC.toString()}
            editable={false}
          />
        </View>

        {/* Add more job fields as needed */}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <CustomButton
          onPress={handleComplete}
          title={'COMPLETE'}
          style={styles.completeBtn}
        />
        
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  label: {
    fontFamily: 'Lato-Black',
    fontSize: 16,
    marginTop: 15,
    color: '#333',
  },
  value: {
    fontSize: 16,
    marginBottom: 10,
    color: '#555',
    fontFamily: 'Lato-Regular',
  },
  buttonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  addButton: {
    height: 50,
    width: 120,
    backgroundColor: 'gray',
    marginVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    height: 40,
    width: 70,
    borderColor: 'gray',
    borderWidth: 1,
    marginVertical: 10,
    paddingLeft: 10,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  completeBtn: {
    backgroundColor: '#3668B1',
    height: 50,
    width:'100%'
  },
});

export default SlittingJobDetailsScreen;
