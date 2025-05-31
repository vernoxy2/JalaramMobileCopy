import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, Alert} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import CustomHeader from '../components/CustomHeader';
import {format} from 'date-fns';

const AdminJobDetailsScreen = ({route, navigation}) => {
  const {order} = route.params;
  const [totalTime, setTotalTime] = useState(null);
  const [totalB, setTotalB] = useState(0);
  const [totalC, setTotalC] = useState(0);

  useEffect(() => {
    if (order.endTime) {
      // Decide start time: printingStartedAt or punchingStartedAt
      const startTimestamp = order.updatedAt || order.updatedByPunchingAt;

      if (startTimestamp) {
        const start = startTimestamp.toDate();
        const end = order.endTime.toDate();
        const durationMs = end - start; // duration in milliseconds

        setTotalTime(durationMs);
      }
    }
  }, [order]);

  useEffect(() => {
    if (order.slittingData && Array.isArray(order.slittingData)) {
      let sumB = 0;
      let sumC = 0;
      order.slittingData.forEach(item => {
        const B = parseFloat(item.B) || 0;
        const C = parseFloat(item.C) || 0;
        sumB += B;
        sumC += C;
      });
      setTotalB(sumB);
      setTotalC(sumC);
    }
  }, [order]);

  const formatTimestamp = timestamp => {
    if (!timestamp) return 'Not started yet';
    return format(timestamp.toDate(), 'dd MMM yyyy, hh:mm a'); // Convert Firestore Timestamp to JS Date and format
  };

  const formatDuration = durationMs => {
    const seconds = Math.floor((durationMs / 1000) % 60);
    const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
    const hours = Math.floor(durationMs / (1000 * 60 * 60));

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <View style={styles.container}>
      <CustomHeader
        showHeadingSection1Container={true}
        showBackBtn={true}
        showHeadingTextContainer={true}
        headingTitle={'Job Details'}
        showHeadingSection2Container
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

        <Text style={styles.label}>Start Time:</Text>
        <Text style={styles.value}>
          {order.updatedAt
            ? formatTimestamp(order.updatedAt)
            : order.updatedByPunchingAt
            ? formatTimestamp(order.updatedByPunchingAt)
            : 'Not started yet'}
        </Text>

        <Text style={styles.label}>End Time:</Text>
        <Text style={styles.value}>
          {order.endTime ? formatTimestamp(order.endTime) : 'Not finished yet'}
        </Text>

        <Text style={styles.label}>Total Time:</Text>
        <Text style={styles.value}>
          {totalTime !== null ? formatDuration(totalTime) : 'Calculating...'}
        </Text>

        <Text style={styles.label}>Running Mtrs:</Text>
        <Text style={styles.value}>
          {order.runningMtr ? order.runningMtr : 'N/A'}
        </Text>

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

        <Text style={styles.label}>Slitting Data:</Text>

        {order.slittingData && order.slittingData.length > 0 ? (
          <>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderCell}>Labels</Text>
              <Text style={styles.tableHeaderCell}>No of Rolls</Text>
              <Text style={styles.tableHeaderCell}>Total</Text>
            </View>

            {order.slittingData.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{item.A}</Text>
                <Text style={styles.tableCell}>{item.B}</Text>
                <Text style={styles.tableCell}>{item.C}</Text>
              </View>
            ))}

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Rolls:</Text>
              <Text style={styles.summaryValue}>{totalB}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Final Total:</Text>
              <Text style={styles.summaryValue}>{totalC}</Text>
            </View>
          </>
        ) : (
          <Text style={styles.value}>No slitting data available.</Text>
        )}
      </ScrollView>
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
    // fontWeight: 'bold',
    fontSize: 16,
    marginTop: 15,
    color: '#000',
    fontFamily: 'Lato-Black',
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

  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 10,
  },
  tableHeaderCell: {
    flex: 1,
    fontFamily: 'Lato-Black',
    textAlign: 'center',
    fontSize: 16,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderColor: '#eee',
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    color: '#444',
    fontFamily: 'Lato-Regular',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#3668B1',
    marginVertical: 5,
    borderRadius: 5,
  },
  summaryLabel: {
    fontFamily: 'Lato-Black',
    fontSize: 16,
    color: '#fff',
  },
  summaryValue: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Lato-Black',
  },
});

export default AdminJobDetailsScreen;
