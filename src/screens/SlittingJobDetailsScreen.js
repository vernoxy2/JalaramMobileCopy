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
import {format} from 'date-fns';

const SlittingJobDetailsScreen = ({route, navigation}) => {
  const {order} = route.params;

  const [inputs, setInputs] = useState([{A: '', B: '', C: ''}]);
  const [totalA, setTotalA] = useState(0);
  const [totalB, setTotalB] = useState(0);
  const [totalC, setTotalC] = useState(0);

  const formatTimestamp = timestamp => {
    if (!timestamp) return 'Not started yet';
    return format(timestamp.toDate(), 'dd MMM yyyy, hh:mm a'); // Convert Firestore Timestamp to JS Date and format
  };

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
        jobStatus: 'Completed',
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
        <Text style={styles.value}>
          {order.jobDate ? order.jobDate.toDate().toDateString() : 'N/A'}
        </Text>

        <Text style={styles.label}>Job Status:</Text>
        <Text style={styles.value}>{order.jobStatus}</Text>

        <Text style={styles.label}>Job Paper:</Text>
        <Text style={styles.value}>{order.jobPaper.label}</Text>

        <View style={styles.readOnlyField}>
          <Text style={styles.label}>Paper Product Code:</Text>
          <Text style={styles.value}>
            {typeof order.paperProductCode === 'object'
              ? order.paperProductCode.label
              : order.paperProductCode}
          </Text>
        </View>

        <Text style={styles.label}>Job Size</Text>
        <Text style={styles.value}>{order.jobSize}</Text>

        <Text style={styles.label}>Printing Plate Size</Text>
        <Text style={styles.value}>{order.printingPlateSize.label}</Text>

        <Text style={styles.label}>Ups : Across</Text>
        <Text style={styles.value}>{order.upsAcross.label}</Text>

        <Text style={styles.label}>Around</Text>
        <Text style={styles.value}>{order.around.label}</Text>

        <Text style={styles.label}>Teeth Size</Text>
        <Text style={styles.value}>{order.teethSize.label}</Text>

        <Text style={styles.label}>Blocks</Text>
        <Text style={styles.value}>{order.blocks.label}</Text>

        <Text style={styles.label}>Winding Direction</Text>
        <Text style={styles.value}>{order.windingDirection.label}</Text>

        <Text style={styles.label}>Running Mtrs</Text>
        <Text style={styles.value}>{order.runningMtr}</Text>

        <Pressable style={styles.addButton} onPress={addInputField}>
          <Text style={styles.buttonText}>Add Row</Text>
        </Pressable>
        <View style={styles.headingRow}>
          <Text style={styles.headingText}>No of Labels</Text>
          <Text style={styles.headingText}>No of Rolls</Text>
          <Text style={styles.headingText}>Total</Text>
        </View>
        {inputs.map((input, index) => (
          <View key={index} style={styles.row}>
            <TextInput
              style={styles.textInput}
              value={input.A}
              placeholder="A"
              keyboardType="numeric"
              onChangeText={text => handleInputChange(text, index, 'A')}
            />

            <TextInput
              style={styles.textInput}
              value={input.B}
              placeholder="B"
              keyboardType="numeric"
              onChangeText={text => handleInputChange(text, index, 'B')}
            />

            <TextInput
              style={styles.textInput}
              value={input.C}
              editable={false}
              placeholder="C"
            />
          </View>
        ))}
        <View style={styles.horizontalLine} />
        <View style={styles.row}>
          <View>
            <Text style={styles.totalText}>Total Labels</Text>
            <TextInput
              style={styles.textInput}
              value={totalA.toString()}
              editable={false}
            />
          </View>
          <View>
            <Text style={styles.totalText}>Total Rolls</Text>
            <TextInput
              style={styles.textInput}
              value={totalB.toString()}
              editable={false}
            />
          </View>
          <View>
            <Text style={styles.totalText}>Grand Total</Text>
            <TextInput
              style={styles.textInput}
              value={totalC.toString()}
              editable={false}
            />
          </View>
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
    width: '100%',
    backgroundColor: '#3668B1',
    marginVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Lato-Black',
  },
  textInput: {
    height: 40,
    width: 80,
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
  headingRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headingText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',

    width: '27%',
  },
  totalText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
  horizontalLine: {
    height: 1,
    width: '100%',
    backgroundColor: 'gray',
    marginVertical: 10,
  },
  completeBtn: {
    backgroundColor: '#3668B1',
    height: 50,
    width: '100%',
  },
});

export default SlittingJobDetailsScreen;
