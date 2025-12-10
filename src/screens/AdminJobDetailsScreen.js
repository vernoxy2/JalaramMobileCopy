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
  const [allocatedMaterials, setAllocatedMaterials] = useState([]);

  useEffect(() => {
    // Extract allocated materials
    const materials = [];

    // Check for main paper product
    if (order.paperProductCode) {
      materials.push({
        code: order.paperProductCode,
        number: order.paperProductNo || '',
        allocatedQty: order.allocatedQty || 0,
        materialCategory: order.materialCategory || 'RAW',
        index: 0,
      });
    }

    // Check for additional paper products (paperProductCode1-10)
    for (let i = 1; i <= 10; i++) {
      const codeKey = `paperProductCode${i}`;
      const numberKey = `paperProductNo${i}`;
      const qtyKey = `allocatedQty${i}`;
      const categoryKey = `materialCategory${i}`;

      if (order[codeKey]) {
        materials.push({
          code: order[codeKey],
          number: order[numberKey] || '',
          allocatedQty: order[qtyKey] || 0,
          materialCategory: order[categoryKey] || 'RAW',
          index: i,
        });
      }
    }

    setAllocatedMaterials(materials);
  }, [order]);

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
    return format(timestamp.toDate(), 'dd MMM yyyy, hh:mm a');
  };

  const formatDuration = durationMs => {
    const seconds = Math.floor((durationMs / 1000) % 60);
    const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
    const hours = Math.floor(durationMs / (1000 * 60 * 60));

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // Helper function to safely render object or string values
  const safeRender = value => {
    if (!value) return '-';
    if (typeof value === 'object' && value.label) return value.label;
    if (typeof value === 'string') return value;
    return '-';
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

  const generatePDF = async () => {
    try {
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Storage permission not granted');
        return;
      }

      // Pre-calculate formatted values
      const jobCreationTime = order.createdAt
        ? formatTimestamp(order.createdAt)
        : '';

      const startTimeFormatted = order.updatedAt
        ? formatTimestamp(order.updatedAt)
        : '';
      const endTimeFormatted = order.endTime
        ? formatTimestamp(order.endTime)
        : '';
      const totalTimeFormatted =
        totalTime !== null ? formatDuration(totalTime) : '';
      const jobDateFormatted = order.jobDate
        ? order.jobDate.toDate().toLocaleDateString()
        : '';
      const printingStartTimeFormatted = order.updatedAt
        ? formatTimestamp(order.updatedAt)
        : '';

      const printingEndTimeFormatted = order.updatedByPrintingAt
        ? formatTimestamp(order.updatedByPrintingAt)
        : '';

      const punchingStartTimeFormatted = order.punchingStartAt
        ? formatTimestamp(order.punchingStartAt)
        : '';

      const punchingEndTimeFormatted = order.updatedByPunchingAt
        ? formatTimestamp(order.updatedByPunchingAt)
        : '';

      const slittingStartTimeFormatted = order.startBySlittingAt
        ? formatTimestamp(order.startBySlittingAt)
        : '';

      const slittingEndTimeFormatted = order.updatedBySlittingAt
        ? formatTimestamp(order.updatedBySlittingAt)
        : '';

      const slittingRows =
        order.slittingData && order.slittingData.length > 0
          ? order.slittingData
              .map(
                item => `
              <tr>
                <td>${item.A || ''}</td>
                <td>${item.B || ''}</td>
                <td>${item.C || ''}</td>
              </tr>`,
              )
              .join('')
          : `<tr><td colspan="3">No data available</td></tr>`;

      const allocatedMaterialsHTML = allocatedMaterials
        .map(
          (material, i) => `
        <div class="row">
          <div class="col">
            <span class="label">Paper Product Code ${i + 1}:</span>
            <span class="input">${safeRender(material.code)}</span>
          </div>
          <div class="col">
            <span class="label">Paper Product No ${i + 1}:</span>
            <span class="input">${material.number || ''}</span>
          </div>
        </div>
        <div class="row">
          <div class="col">
            <span class="label">Allocated Qty ${i + 1}:</span>
            <span class="input">${material.allocatedQty}m</span>
          </div>
          <div class="col">
            <span class="label">Material Category ${i + 1}:</span>
            <span class="input">${material.materialCategory}</span>
          </div>
        </div>
      `,
        )
        .join('');

      const htmlContent = `
      <html>
      <head>
          <style>
          body { font-family: Arial, sans-serif; }
          h1 { text-align: center; color: #3668B1; }
          .section { border: 2px solid #3668B1; border-radius: 8px; margin-bottom: 18px; padding: 10px 15px; }
          .section-title { background: #3668B1; color: #fff; font-weight: bold; padding: 3px 10px; border-radius: 5px; display: inline-block; margin-bottom: 10px; }
          .row { display: flex; flex-wrap: wrap; margin-bottom: 8px; }
          .col { flex: 1; min-width: 180px; margin-right: 10px; }
          .label { font-weight: bold; }
          .input { display: inline-block; min-width: 120px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #3668B1; padding: 4px 8px; text-align: center; }
          .small-table td { min-width: 40px; }
          .color-seq-table { margin-bottom: 15px; }
          .time-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 20px;
              flex-wrap: nowrap;
            }
            .time-row .col {
              flex: 0 0 auto;
              white-space: nowrap;
            }
            .time-row .col:last-child {
              margin-left: auto;
            }
        </style>

      </head>
      <body>    

        <div class="section">

          <div class="section-title">Admin</div>
          <div class="row">
                <div class="col"><span class="label">PO No.:</span> <span class="input">${
                  order.poNo || ''
                }</span></div>
                <div class="col"><span class="label">Job Date:</span> <span class="input">${jobDateFormatted}</span></div>
          </div>
          <div class="row">
                <div class="col"><span class="label">Customer Name:</span> <span class="input">${
                  order.customerName || ''
                }</span></div>
                  <div class="col"><span class="label">Label Type:</span> <span class="input">${
                    order.jobType || ''
                  }</span></div>
              
          </div>
          <div class="row">
                <div class="col"><span class="label">Job Card no:</span> <span class="input">${
                  order.jobCardNo || ''
                }</span></div>
                <div class="col"><span class="label">Job Name:</span> <span class="input">${
                  order.jobName || ''
                }</span></div>
          </div>
          <div class="row">
              <div class="col"><span class="label">Job Original Size:</span> <span class="input">${
                order.jobSize || ''
              }</span></div>
              <div class="col"><span class="label">Job Qty:</span> <span class="input">${
                order.jobQty || ''
              }</span></div>
          </div>        
          <div class="row">
              <div class="col"><span class="label">Job Creation Time:</span> <span class="input">${jobCreationTime}</span></div>  
              <div class="col"><span class="label">Teeth Size:</span> <span class="input">${safeRender(
                order.teethSize,
              )}</span></div>           
          </div>          
            <div class="row time-row">
            <div class="col"><span class="label">Start time:</span> <span class="input">${startTimeFormatted}</span></div>
            <div class="col"><span class="label">End time:</span> <span class="input">${endTimeFormatted}</span></div>
            <div class="col"><span class="label">Total time:</span> <span class="input">${totalTimeFormatted}</span></div>
          </div>

        </div>

        <div class="section">
          <div class="section-title">Printing</div>
          <div class="row">
            <div class="col"><span class="label">Printing Start Time:</span> <span class="input">${
              printingStartTimeFormatted || ''
            }</span></div>
            <div class="col"><span class="label">Printing End Time:</span> <span class="input">${
              printingEndTimeFormatted || ''
            }</span></div>
          </div>
          <div class="row"><span class="label">Color Seq.</span></div>
          
          <table class="small-table color-seq-table">
              <tr>
                <td>C : ${order.colorAniloxValues?.C?.value || ''}</td>
                <td>M : ${order.colorAniloxValues?.M?.value || ''}</td>
                <td>Y : ${order.colorAniloxValues?.Y?.value || ''}</td>
                <td>K : ${order.colorAniloxValues?.K?.value || ''}</td>
              </tr>
              <tr>
                <td>Sp1 : ${order.colorAniloxValues?.Sq1?.value || ''}</td>
                <td>Sp2 : ${order.colorAniloxValues?.Sq2?.value || ''}</td>    
                <td>Sp3 : ${order.colorAniloxValues?.Sq3?.value || ''}</td>
                <td>Sp4 : ${order.colorAniloxValues?.Sq4?.value || ''}</td>
              </tr>
            </table>

          <div class="row">
                <div class="col"><span class="label">Running Mtrs:</span> <span class="input">${
                  order.runningMtr || ''
                }</span></div>
                <div class="col"><span class="label">Tooling:</span> <span class="input">${
                  order.tooling || ''
                }</span></div>
          </div>

          ${allocatedMaterialsHTML}

           <div class="row">
              <div class="col">
                <span class="label">Printing Colors:</span>
                <span class="input">
                  ${
                    order.printingColors && order.printingColors.length > 0
                      ? order.printingColors.join(', ')
                      : ''
                  }
                </span>
              </div>
         </div>
        </div>

        <div class="section">
          <div class="section-title">Punching</div>
          <div class="row">
            <div class="col"><span class="label">Punching Start Time:</span> <span class="input">${
              punchingStartTimeFormatted || ''
            }</span></div>
            <div class="col"><span class="label">Punching End Time:</span> <span class="input">${
              punchingEndTimeFormatted || ''
            }</span></div>
          </div>
          <div class="row">
            <div class="col"><span class="label">Paper Code:</span> <span class="input">${
              order.paperCode || ''
            }</span></div>
            <div class="col"><span class="label">Running Mtrs:</span> <span class="input">${
              order.runningMtr || ''
            }</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Slitting</div>
          <div class="row">
            <div class="col"><span class="label">Slitting Start Time:</span> <span class="input">${
              slittingStartTimeFormatted || ''
            }</span></div>
            <div class="col"><span class="label">Slitting End Time:</span> <span class="input">${
              slittingEndTimeFormatted || ''
            }</span></div>
          </div>
          <div class="subsection">
            <table border="1">
              <thead>
                <tr>
                  <th>Labels</th>
                  <th>No of Rolls</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${slittingRows}
              </tbody>
            </table>

          </div>
        </div>
      </body>
      </html>
    `;

      // Safe filename logic
      const rawJobCardNo = order.jobCardNo || 'Unknown';
      const safeJobCardNo = rawJobCardNo
        .toString()
        .replace(/[^a-zA-Z0-9_-]/g, '')
        .slice(0, 20);

      const fileName = `Job_Details_${safeJobCardNo}`;

      const path = `${RNFS.DocumentDirectoryPath}/${fileName}.pdf`;

      const options = {
        html: htmlContent,
        fileName: `Job_Details_${order.jobCardNo}`,
        filePath: path,
        base64: false,
      };

      const file = await RNHTMLtoPDF.convert(options);
      Alert.alert('Success', `PDF saved to: ${file.filePath}`);

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

      // Pre-calculate formatted values
      const jobCreationTime = order.createdAt
        ? formatTimestamp(order.createdAt)
        : '';
      const startTimeFormatted = order.updatedAt
        ? formatTimestamp(order.updatedAt)
        : '';
      const endTimeFormatted = order.endTime
        ? formatTimestamp(order.endTime)
        : '';
      const totalTimeFormatted =
        totalTime !== null ? formatDuration(totalTime) : '';
      const jobDateFormatted = order.jobDate
        ? order.jobDate.toDate().toLocaleDateString()
        : '';

      const printingStartTimeFormatted = order.updatedAt
        ? formatTimestamp(order.updatedAt)
        : '';
      const printingEndTimeFormatted = order.updatedByPrintingAt
        ? formatTimestamp(order.updatedByPrintingAt)
        : '';
      const punchingStartTimeFormatted = order.punchingStartAt
        ? formatTimestamp(order.punchingStartAt)
        : '';
      const punchingEndTimeFormatted = order.updatedByPunchingAt
        ? formatTimestamp(order.updatedByPunchingAt)
        : '';
      const slittingStartTimeFormatted = order.startBySlittingAt
        ? formatTimestamp(order.startBySlittingAt)
        : '';
      const slittingEndTimeFormatted = order.updatedBySlittingAt
        ? formatTimestamp(order.updatedBySlittingAt)
        : '';

      const slittingRows =
        order.slittingData && order.slittingData.length > 0
          ? order.slittingData
              .map(
                item => `
              <tr>
                <td>${item.A || ''}</td>
                <td>${item.B || ''}</td>
                <td>${item.C || ''}</td>
              </tr>`,
              )
              .join('')
          : `<tr><td colspan="3">No data available</td></tr>`;

      const allocatedMaterialsHTML = allocatedMaterials
        .map(
          (material, i) => `
        <div class="row">
          <div class="col">
            <span class="label">Paper Product Code ${i + 1}:</span>
            <span class="input">${safeRender(material.code)}</span>
          </div>
          <div class="col">
            <span class="label">Paper Product No ${i + 1}:</span>
            <span class="input">${material.number || ''}</span>
          </div>
        </div>
        <div class="row">
          <div class="col">
            <span class="label">Allocated Qty ${i + 1}:</span>
            <span class="input">${material.allocatedQty}m</span>
          </div>
          <div class="col">
            <span class="label">Material Category ${i + 1}:</span>
            <span class="input">${material.materialCategory}</span>
          </div>
        </div>
      `,
        )
        .join('');

      const htmlContent = `
      <html>
      <head>
          <style>
          body { font-family: Arial, sans-serif; }
          h1 { text-align: center; color: #3668B1; }
          .section { border: 2px solid #3668B1; border-radius: 8px; margin-bottom: 18px; padding: 10px 15px; }
          .section-title { background: #3668B1; color: #fff; font-weight: bold; padding: 3px 10px; border-radius: 5px; display: inline-block; margin-bottom: 10px; }
          .row { display: flex; flex-wrap: wrap; margin-bottom: 8px; }
          .col { flex: 1; min-width: 180px; margin-right: 10px; }
          .label { font-weight: bold; }
          .input { display: inline-block; min-width: 120px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #3668B1; padding: 4px 8px; text-align: center; }
          .small-table td { min-width: 40px; }
          .color-seq-table { margin-bottom: 15px; }
          .time-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 20px;
              flex-wrap: nowrap;
            }
            .time-row .col {
              flex: 0 0 auto;
              white-space: nowrap;
            }
            .time-row .col:last-child {
              margin-left: auto;
            }
        </style>

      </head>
      <body>    

        <div class="section">

          <div class="section-title">Admin</div>
          <div class="row">
                <div class="col"><span class="label">PO No.:</span> <span class="input">${
                  order.poNo || ''
                }</span></div>
                <div class="col"><span class="label">Job Date:</span> <span class="input">${jobDateFormatted}</span></div>
          </div>
          <div class="row">
                <div class="col"><span class="label">Customer Name:</span> <span class="input">${
                  order.customerName || ''
                }</span></div>
                  <div class="col"><span class="label">Label Type:</span> <span class="input">${
                    order.jobType || ''
                  }</span></div>
              
          </div>
          <div class="row">
                <div class="col"><span class="label">Job Card no:</span> <span class="input">${
                  order.jobCardNo || ''
                }</span></div>
                <div class="col"><span class="label">Job Name:</span> <span class="input">${
                  order.jobName || ''
                }</span></div>
          </div>
          <div class="row">
              <div class="col"><span class="label">Job Original Size:</span> <span class="input">${
                order.jobSize || ''
              }</span></div>
              <div class="col"><span class="label">Job Qty:</span> <span class="input">${
                order.jobQty || ''
              }</span></div>
          </div>        
          <div class="row">
              <div class="col"><span class="label">Job Creation Time:</span> <span class="input">${jobCreationTime}</span></div>  
              <div class="col"><span class="label">Teeth Size:</span> <span class="input">${safeRender(
                order.teethSize,
              )}</span></div>           
          </div>          
            <div class="row time-row">
            <div class="col"><span class="label">Start time:</span> <span class="input">${startTimeFormatted}</span></div>
            <div class="col"><span class="label">End time:</span> <span class="input">${endTimeFormatted}</span></div>
            <div class="col"><span class="label">Total time:</span> <span class="input">${totalTimeFormatted}</span></div>
          </div>

        </div>

        <div class="section">
          <div class="section-title">Printing</div>
          <div class="row">
            <div class="col"><span class="label">Printing Start Time:</span> <span class="input">${
              printingStartTimeFormatted || ''
            }</span></div>
            <div class="col"><span class="label">Printing End Time:</span> <span class="input">${
              printingEndTimeFormatted || ''
            }</span></div>
          </div>
          <div class="row"><span class="label">Color Seq.</span></div>
          
          <table class="small-table color-seq-table">
              <tr>
                <td>C : ${order.colorAniloxValues?.C?.value || ''}</td>
                <td>M : ${order.colorAniloxValues?.M?.value || ''}</td>
                <td>Y : ${order.colorAniloxValues?.Y?.value || ''}</td>
                <td>K : ${order.colorAniloxValues?.K?.value || ''}</td>
              </tr>
              <tr>
                <td>Sp1 : ${order.colorAniloxValues?.Sq1?.value || ''}</td>
                <td>Sp2 : ${order.colorAniloxValues?.Sq2?.value || ''}</td>    
                <td>Sp3 : ${order.colorAniloxValues?.Sq3?.value || ''}</td>
                <td>Sp4 : ${order.colorAniloxValues?.Sq4?.value || ''}</td>
              </tr>
            </table>

          <div class="row">
                <div class="col"><span class="label">Running Mtrs:</span> <span class="input">${
                  order.runningMtr || ''
                }</span></div>
                <div class="col"><span class="label">Tooling:</span> <span class="input">${
                  order.tooling || ''
                }</span></div>
          </div>

          ${allocatedMaterialsHTML}

           <div class="row">
              <div class="col">
                <span class="label">Printing Colors:</span>
                <span class="input">
                  ${
                    order.printingColors && order.printingColors.length > 0
                      ? order.printingColors.join(', ')
                      : ''
                  }
                </span>
              </div>
         </div>
        </div>

        <div class="section">
          <div class="section-title">Punching</div>
          <div class="row">
            <div class="col"><span class="label">Punching Start Time:</span> <span class="input">${
              punchingStartTimeFormatted || ''
            }</span></div>
            <div class="col"><span class="label">Punching End Time:</span> <span class="input">${
              punchingEndTimeFormatted || ''
            }</span></div>
          </div>
          <div class="row">
            <div class="col"><span class="label">Paper Code:</span> <span class="input">${
              order.paperCode || ''
            }</span></div>
            <div class="col"><span class="label">Running Mtrs:</span> <span class="input">${
              order.runningMtr || ''
            }</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Slitting</div>
          <div class="row">
            <div class="col"><span class="label">Slitting Start Time:</span> <span class="input">${
              slittingStartTimeFormatted || ''
            }</span></div>
            <div class="col"><span class="label">Slitting End Time:</span> <span class="input">${
              slittingEndTimeFormatted || ''
            }</span></div>
          </div>
          <div class="subsection">
            <table border="1">
              <thead>
                <tr>
                  <th>Labels</th>
                  <th>No of Rolls</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${slittingRows}
              </tbody>
            </table>

          </div>
        </div>
      </body>
      </html>
    `;

      // Short timestamp
      const now = new Date();
      const shortStamp = `${now.getHours()}${now.getMinutes()}`;

      const cleanCustomerName = (order.customerName || 'Customer')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .substring(0, 10);

      const cleanJobName = (order.jobName || 'Job')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .substring(0, 12);

      const cleanJobCardNo = (order.jobCardNo || '0000')
        .replace(/[^a-zA-Z0-9]/g, '')
        .substring(0, 8);

      const fileName = `JobDetails_${cleanCustomerName}_${cleanJobName}_${cleanJobCardNo}_${shortStamp}`;

      const privatePath = `${RNFS.DocumentDirectoryPath}/${fileName}.pdf`;
      const downloadsPath = `${RNFS.DownloadDirectoryPath}/${fileName}.pdf`;

      // Generate and copy PDF
      const file = await RNHTMLtoPDF.convert({
        html: htmlContent,
        fileName,
        filePath: privatePath,
        base64: false,
      });

      await RNFS.copyFile(file.filePath, downloadsPath);

      Alert.alert('Success', `PDF saved to Downloads:\n${downloadsPath}`);
      console.log('✅ PDF saved:', downloadsPath);
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

        <Text style={styles.label}>Job Name:</Text>
        <Text style={styles.value}>{order.jobName}</Text>

        <Text style={styles.label}>Job Qty:</Text>
        <Text style={styles.value}>{order.jobQty}</Text>

        <Text style={styles.label}>Customer Name:</Text>
        <Text style={styles.value}>{order.customerName}</Text>

        <Text style={styles.label}>Job Date:</Text>
        <Text style={styles.value}>
          {order.jobDate ? order.jobDate.toDate().toDateString() : 'N/A'}
        </Text>

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
        <Text style={styles.value}>{safeRender(order.jobPaper)}</Text>

        {order.jobType !== 'Printing' ? (
          <View>
            <Text style={styles.label}>Paper Code</Text>
            <Text style={styles.value}>{order.paperCode}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Job Size</Text>
        <Text style={styles.value}>{order.jobSize}</Text>

        <Text style={styles.label}>Printing Plate Size</Text>
        <Text style={styles.value}>{safeRender(order.printingPlateSize)}</Text>

        <Text style={styles.label}>Across Ups</Text>
        <Text style={styles.value}>{safeRender(order.upsAcross)}</Text>

        <Text style={styles.label}>Across Gap</Text>
        <Text style={styles.value}>{order.acrossGap}</Text>

        <Text style={styles.label}>Around</Text>
        <Text style={styles.value}>{safeRender(order.around)}</Text>

        <Text style={styles.label}>Around Gap</Text>
        <Text style={styles.value}>{order.aroundGap}</Text>

        <Text style={styles.label}>Teeth Size</Text>
        <Text style={styles.value}>{safeRender(order.teethSize)}</Text>

        <Text style={styles.label}>Blocks</Text>
        <Text style={styles.value}>{safeRender(order.blocks)}</Text>

        <Text style={styles.label}>Winding Direction</Text>
        <Text style={styles.value}>{safeRender(order.windingDirection)}</Text>

        <Text style={styles.label}>Tooling</Text>
        <Text style={styles.value}>{order.tooling}</Text>

        <Text style={styles.label}>Allocated Materials:</Text>
        {allocatedMaterials.length === 0 ? (
          <Text style={styles.value}>No materials allocated yet.</Text>
        ) : (
          allocatedMaterials.map((material, index) => (
            <View key={index} style={styles.materialCard}>
              <View style={styles.readOnlyField}>
                <Text style={styles.label}>Paper Product Code:</Text>
                <Text style={styles.value}>{safeRender(material.code)}</Text>
              </View>

              <View style={styles.readOnlyField}>
                <Text style={styles.label}>Paper Product No:</Text>
                <Text style={styles.value}>{material.number || '-'}</Text>
              </View>

              <View style={styles.readOnlyField}>
                <Text style={styles.label}>Allocated Qty:</Text>
                <Text style={styles.value}>{material.allocatedQty}m</Text>
              </View>

              <View style={styles.readOnlyField}>
                <Text style={styles.label}>Material Category:</Text>
                <Text style={styles.value}>{material.materialCategory}</Text>
              </View>
            </View>
          ))
        )}

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
  materialCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  readOnlyField: {
    marginBottom: 8,
  },
});

export default AdminJobDetailsScreen;
