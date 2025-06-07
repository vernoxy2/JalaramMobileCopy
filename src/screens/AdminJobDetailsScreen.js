import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, Alert} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import CustomHeader from '../components/CustomHeader';
import {format} from 'date-fns';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import {PermissionsAndroid, Platform, Button} from 'react-native';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import Share from 'react-native-share';

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

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      const sdkVersion = Platform.constants?.Release || 0;

      if (parseInt(sdkVersion) >= 13) {
        // No need to ask for WRITE_EXTERNAL_STORAGE on Android 13+
        return true;
      }

      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission Required',
            message: 'This app needs access to your storage to save PDF files.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Permission error:', err);
        return false;
      }
    } else {
      return true;
    }
  };

  const openPDFWithIntentLauncher = async filePath => {
    if (Platform.OS === 'android') {
      try {
        await IntentLauncher.startActivity({
          action: 'android.intent.action.VIEW',
          data: `file://${filePath}`,
          type: 'application/pdf',
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        });
        console.log('PDF opened with IntentLauncher');
      } catch (err) {
        console.error('IntentLauncher error:', err);
        Alert.alert(
          'Error Opening PDF',
          'No app found to open PDF files. Please install a PDF viewer.',
        );
      }
    } else {
      Alert.alert(
        'Not Supported',
        'Opening PDFs via IntentLauncher is currently only supported on Android.',
      );
    }
  };

  const generatePDF = async () => {
    try {
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Storage permission not granted');
        return;
      }

      const htmlContent = `
      <h1>Job Details</h1>
      <p><strong>Job Card No:</strong> ${order.jobCardNo}</p>
      <p><strong>Customer Name:</strong> ${order.customerName}</p>
      <p><strong>Job Date:</strong> ${order.jobDate}</p>
      <p><strong>Job Status:</strong> ${order.jobStatus}</p>
      <p><strong>Start Time:</strong> ${formatTimestamp(
        order.updatedAt || order.updatedByPunchingAt,
      )}</p>
      <p><strong>End Time:</strong> ${formatTimestamp(order.endTime)}</p>
      <p><strong>Total Time:</strong> ${
        totalTime !== null ? formatDuration(totalTime) : 'N/A'
      }</p>
      <p><strong>Running Mtrs:</strong> ${order.runningMtr}</p>
      <p><strong>Job Paper:</strong> ${order.jobPaper.label}</p>
      <p><strong>Paper Product Code:</strong> ${
        typeof order.paperProductCode === 'object'
          ? order.paperProductCode.label
          : order.paperProductCode
      }</p>
      <p><strong>Job Size:</strong> ${order.jobSize}</p>
      <p><strong>Printing Plate Size:</strong> ${
        order.printingPlateSize.label
      }</p>
      <p><strong>Ups Across:</strong> ${order.upsAcross.label}</p>
      <p><strong>Around:</strong> ${order.around.label}</p>
      <p><strong>Teeth Size:</strong> ${order.teethSize.label}</p>
      <p><strong>Blocks:</strong> ${order.blocks.label}</p>
      <p><strong>Winding Direction:</strong> ${order.windingDirection.label}</p>

      <h2>Slitting Data</h2>
      ${
        order.slittingData && order.slittingData.length > 0
          ? `<table border="1" style="width:100%; border-collapse: collapse;">
              <tr><th>Label</th><th>No of Rolls</th><th>Total</th></tr>
              ${order.slittingData
                .map(
                  item =>
                    `<tr><td>${item.A}</td><td>${item.B}</td><td>${item.C}</td></tr>`,
                )
                .join('')}
            </table>
            <p><strong>Total Rolls:</strong> ${totalB}</p>
            <p><strong>Final Total:</strong> ${totalC}</p>`
          : '<p>No slitting data available.</p>'
      }
    `;

      const path = `${RNFS.DocumentDirectoryPath}/Job_Details_${order.jobCardNo}.pdf`;

      const options = {
        html: htmlContent,
        fileName: `Job_Details_${order.jobCardNo}`,
        filePath: path, // manually specify full path
        base64: false,
      };

      const file = await RNHTMLtoPDF.convert(options);
      Alert.alert('Success', `PDF saved to: ${file.filePath}`);
      // After PDF generation
      const filePath = file.filePath;

      Share.open({
        title: 'Open PDF',
        url: `file://${filePath}`,
        type: 'application/pdf',
      })
        .then(() => console.log('Share opened'))
        .catch(err => {
          console.error('Share error:', err);
          Alert.alert('Error', 'Unable to share the PDF file.');
        });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };


  const savePDF = async () => {
  try {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Storage permission not granted');
      return;
    }

   
   const htmlContent = `
      <h1>FLEXO JOB CARD</h1>
      <p><strong>Job Card No:</strong> ${order.jobCardNo}</p>
      <p><strong>Customer Name:</strong> ${order.customerName}</p>
      <p><strong>Job Date:</strong> ${order.jobDate}</p>
      <p><strong>Job Status:</strong> ${order.jobStatus}</p>
      <p><strong>Start Time:</strong> ${formatTimestamp(
        order.updatedAt || order.updatedByPunchingAt,
      )}</p>
      <p><strong>End Time:</strong> ${formatTimestamp(order.endTime)}</p>
      <p><strong>Total Time:</strong> ${
        totalTime !== null ? formatDuration(totalTime) : 'N/A'
      }</p>
      <p><strong>Running Mtrs:</strong> ${order.runningMtr}</p>
      <p><strong>Job Paper:</strong> ${order.jobPaper.label}</p>
      <p><strong>Paper Product Code:</strong> ${
        typeof order.paperProductCode === 'object'
          ? order.paperProductCode.label
          : order.paperProductCode
      }</p>
      <p><strong>Job Size:</strong> ${order.jobSize}</p>
      <p><strong>Printing Plate Size:</strong> ${
        order.printingPlateSize.label
      }</p>
      <p><strong>Ups Across:</strong> ${order.upsAcross.label}</p>
      <p><strong>Around:</strong> ${order.around.label}</p>
      <p><strong>Teeth Size:</strong> ${order.teethSize.label}</p>
      <p><strong>Blocks:</strong> ${order.blocks.label}</p>
      <p><strong>Winding Direction:</strong> ${order.windingDirection.label}</p>

      <h2>Slitting Data</h2>
      ${
        order.slittingData && order.slittingData.length > 0
          ? `<table border="1" style="width:100%; border-collapse: collapse;">
              <tr><th>Label</th><th>No of Rolls</th><th>Total</th></tr>
              ${order.slittingData
                .map(
                  item =>
                    `<tr><td>${item.A}</td><td>${item.B}</td><td>${item.C}</td></tr>`,
                )
                .join('')}
            </table>
            <p><strong>Total Rolls:</strong> ${totalB}</p>
            <p><strong>Final Total:</strong> ${totalC}</p>`
          : '<p>No slitting data available.</p>'
      }
    `;


    const privatePath = `${RNFS.DocumentDirectoryPath}/Job_Details_${order.jobCardNo}.pdf`;

    const options = {
      html: htmlContent,
      fileName: `Job_Details_${order.jobCardNo}`,
      filePath: privatePath,
      base64: false,
    };

    // Generate PDF in app private directory
    const file = await RNHTMLtoPDF.convert(options);

    // Define path in public Downloads directory
    const downloadsPath = `${RNFS.DownloadDirectoryPath}/Job_Details_${order.jobCardNo}.pdf`;

    // Copy file from private to public Downloads folder
    await RNFS.copyFile(file.filePath, downloadsPath);

    Alert.alert('Success', `PDF saved to Downloads folder:\n${downloadsPath}`);

    // Optional: open the PDF directly after saving
    // await FileViewer.open(downloadsPath, { showOpenWithDialog: true });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    Alert.alert('Error', 'Failed to generate or save PDF');
  }
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

        <View style={{marginVertical: 20}}>
          <Button title="Share PDF" onPress={generatePDF} />
        </View>

        <View style={{marginVertical: 20}}>
          <Button title="Download PDF" onPress={savePDF} />
        </View>

        
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
