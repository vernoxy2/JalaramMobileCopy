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

  // NEW: Generate material usage table for each stage
  const generateStageUsageTable = stageName => {
    if (
      !order.materialUsageTracking ||
      order.materialUsageTracking.length === 0
    ) {
      return '';
    }

    const stageKey = stageName.toLowerCase();
    const isPrintingStage = stageKey === 'printing';

    const rows = order.materialUsageTracking
      .map(material => {
        const stageData = material[stageKey];
        if (!stageData) return '';

        const paperCode = material.paperProductCode || 'N/A';
        const paperNo = material.paperProductNo || 'N/A';

        // Only get allocated and category for printing stage
        const allocated = isPrintingStage
          ? material.printing?.allocated || 0
          : null;
        const materialCategory = isPrintingStage
          ? material.printing?.materialCategory || 'N/A'
          : null;

        return `
        <tr>
          <td>${paperCode} (${paperNo})</td>
          ${isPrintingStage ? `<td>${allocated}m</td>` : ''}
          ${isPrintingStage ? `<td>${materialCategory}</td>` : ''}
          <td>${stageData.used || 0}</td>
          <td>${stageData.waste || 0}</td>
          <td>${stageData.leftover || 0}</td>
          <td>${stageData.wip || 0}</td>
        </tr>
      `;
      })
      .filter(Boolean)
      .join('');

    if (!rows) return '';

    return `
    <div>
      <div class="usage-title">Material Usage:</div>
      <table class="usage-table">
        <thead>
          <tr>
            <th>Material</th>
            ${isPrintingStage ? '<th>Allocated (m)</th>' : ''}
            ${isPrintingStage ? '<th>Category</th>' : ''}
            <th>Used (m)</th>
            <th>Waste (m)</th>
            <th>Leftover (m)</th>
            <th>WIP (m)</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
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

      // Calculate slitting grand total
      const slittingGrandTotal =
        order.slittingData && order.slittingData.length > 0
          ? order.slittingData.reduce(
              (sum, item) => sum + (parseFloat(item.C) || 0),
              0,
            )
          : 0;

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
              .join('') +
            `
            <tr style="font-weight: bold; background-color: #f0f0f0;">
              <td colspan="2" style="text-align: right;">Grand Total:</td>
              <td>${slittingGrandTotal}</td>
            </tr>`
          : `<tr><td colspan="3">No data available</td></tr>`;

      const htmlContent = `
      <html>
      <head>
          <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body { 
            font-family: Arial, sans-serif;
            padding: 10px;
          }
          
          h1 { 
            text-align: center; 
            color: #3668B1;
            margin-bottom: 20px;
            font-size: 24px;
            page-break-after: avoid;
          }
          
          .section { 
            border: 2px solid #3668B1; 
            border-radius: 8px; 
            margin-bottom: 15px; 
            padding: 12px 15px 15px 15px;
            page-break-inside: avoid;
          }
          
          .section.punching-section {
            margin-top: 20px;
          }
          
          .section.slitting-section {
            margin-top: 20px;
          }
          
          .section-title { 
            background: #3668B1; 
            color: #fff; 
            font-weight: bold; 
            padding: 6px 14px; 
            border-radius: 5px; 
            display: inline-block; 
            margin-bottom: 12px;
            font-size: 14px;
          }
          
          .row { 
            display: flex; 
            flex-wrap: wrap; 
            margin-bottom: 8px; 
          }
          
          .col { 
            flex: 1; 
            min-width: 180px; 
            margin-right: 10px; 
          }
          
          .label { 
            font-weight: bold;
            font-size: 12px;
          }
          
          .input { 
            display: inline-block; 
            min-width: 120px;
            font-size: 12px;
          }
          
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 8px; 
          }
          
          th, td { 
            border: 1px solid #3668B1; 
            padding: 5px 8px; 
            text-align: center;
            font-size: 11px;
          }
          
          .small-table td { 
            min-width: 40px; 
          }
          
          .color-seq-table { 
            margin-bottom: 12px; 
          }
          
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
        
          /* Material Usage Styles */
          .usage-section {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 2px solid #3668B1;
            page-break-inside: avoid;
          }
          
          .usage-title {
            font-weight: bold;
            margin-bottom: 6px;
            color: #3668B1;
            font-size: 13px;
            page-break-after: avoid;
          }
          
          .usage-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            page-break-inside: auto;
          }
          
          .usage-table th {
            background: #3668B1;
            color: white;
            padding: 6px 4px;
            font-size: 10px;
            font-weight: bold;
          }
          
          .usage-table td {
            padding: 5px 4px;
            font-size: 9px;
            text-align: center;
            border: 1px solid #3668B1;
          }
          
          .usage-table tbody tr:nth-child(even) {
            background: #f5f8fc;
          }
          
          .usage-table tbody tr:nth-child(odd) {
            background: #ffffff;
          }

          .usage-table thead {
            display: table-header-group;
            page-break-after: avoid;
          }
          
          .usage-table tr {
            page-break-inside: avoid;
          }

          /* Print-specific rules */
          @media print {
            body {
              padding: 5px;
            }
            
            h1 {
              page-break-after: avoid;
            }
            
            .section {
              page-break-inside: avoid;
              margin-bottom: 10px;
            }
            
            .section.punching-section {
              page-break-before: always !important;
            }
            
            .section.allow-break {
              page-break-inside: auto;
            }
            
            .usage-section {
              page-break-before: auto;
              page-break-inside: avoid;
            }
            
            .usage-table thead {
              display: table-header-group;
            }
            
            .usage-table tbody tr {
              page-break-inside: avoid;
            }
            
            .usage-table thead tr,
            .usage-table tbody tr:first-child {
              page-break-after: avoid;
            }
          }

          @page {
            margin: 15mm;
          }
          
          .page-break {
            display: block;
            page-break-before: always;
            page-break-after: always;
            break-before: page;
            break-after: page;
            height: 0;
            margin: 0;
            padding: 0;
            border: none;
          }
        </style>

      </head>
      <body>    
        <h1>Job Card Report</h1>

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
              <div class="col"><span class="label">Job Original Size:</span> <span class="input">${`${order.jobLength} * ${order.jobWidth}`}</span></div>
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

        <div id="printing-section" class="section allow-break">
          <div class="section-title">Printing</div>
          <div class="row">
            <div class="col"><span class="label">Printing Start Time:</span> <span class="input">${
              order.jobType === 'Plain' ? '' : printingStartTimeFormatted || ''
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
               <div class="col"><span class="label">Actual Required Material:</span> <span class="input">${
                 order.totalPaperRequired || ''
               }</span></div>
         </div>

         ${generateStageUsageTable('printing')}
        </div>

        <div id="punching-section" class="section allow-break punching-section">
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
            <div class="col"><span class="label">Running Mtrs:</span> <span class="input">
            ${order.runningMtr || ''}
            </span></div>
          </div>

          ${generateStageUsageTable('punching')}
        </div>

        <div id="slitting-section" class="section allow-break slitting-section">
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

          ${generateStageUsageTable('slitting')}
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

      // Calculate slitting grand total
      const slittingGrandTotal =
        order.slittingData && order.slittingData.length > 0
          ? order.slittingData.reduce(
              (sum, item) => sum + (parseFloat(item.C) || 0),
              0,
            )
          : 0;

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
              .join('') +
            `
            <tr style="font-weight: bold; background-color: #f0f0f0;">
              <td colspan="2" style="text-align: right;">Grand Total:</td>
              <td>${slittingGrandTotal}</td>
            </tr>`
          : `<tr><td colspan="3">No data available</td></tr>`;

      const htmlContent = `
      <html>
      <head>
          <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body { 
            font-family: Arial, sans-serif;
            padding: 10px;
          }
          
          h1 { 
            text-align: center; 
            color: #3668B1;
            margin-bottom: 20px;
            font-size: 24px;
            page-break-after: avoid;
          }
          
          .section { 
            border: 2px solid #3668B1; 
            border-radius: 8px; 
            margin-bottom: 15px; 
            padding: 12px 15px 15px 15px;
            page-break-inside: avoid;
          }
          
          .section.punching-section {
            margin-top: 20px;
          }
          
          .section.slitting-section {
            margin-top: 20px;
          }
          
          .section-title { 
            background: #3668B1; 
            color: #fff; 
            font-weight: bold; 
            padding: 6px 14px; 
            border-radius: 5px; 
            display: inline-block; 
            margin-bottom: 12px;
            font-size: 14px;
          }
          
          .row { 
            display: flex; 
            flex-wrap: wrap; 
            margin-bottom: 8px; 
          }
          
          .col { 
            flex: 1; 
            min-width: 180px; 
            margin-right: 10px; 
          }
          
          .label { 
            font-weight: bold;
            font-size: 12px;
          }
          
          .input { 
            display: inline-block; 
            min-width: 120px;
            font-size: 12px;
          }
          
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 8px; 
          }
          
          th, td { 
            border: 1px solid #3668B1; 
            padding: 5px 8px; 
            text-align: center;
            font-size: 11px;
          }
          
          .small-table td { 
            min-width: 40px; 
          }
          
          .color-seq-table { 
            margin-bottom: 12px; 
          }
          
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
        
          /* Material Usage Styles */
          .usage-section {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 2px solid #3668B1;
            page-break-inside: avoid;
          }
          
          .usage-title {
            font-weight: bold;
            margin-bottom: 6px;
            color: #3668B1;
            font-size: 13px;
            page-break-after: avoid;
          }
          
          .usage-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            page-break-inside: auto;
          }
          
          .usage-table th {
            background: #3668B1;
            color: white;
            padding: 6px 4px;
            font-size: 10px;
            font-weight: bold;
          }
          
          .usage-table td {
            padding: 5px 4px;
            font-size: 9px;
            text-align: center;
            border: 1px solid #3668B1;
          }
          
          .usage-table tbody tr:nth-child(even) {
            background: #f5f8fc;
          }
          
          .usage-table tbody tr:nth-child(odd) {
            background: #ffffff;
          }

          .usage-table thead {
            display: table-header-group;
            page-break-after: avoid;
          }
          
          .usage-table tr {
            page-break-inside: avoid;
          }

          /* Print-specific rules */
          @media print {
            body {
              padding: 5px;
            }
            
            h1 {
              page-break-after: avoid;
            }
            
            .section {
              page-break-inside: avoid;
              margin-bottom: 10px;
            }
            
            .section.punching-section {
              page-break-before: always !important;
            }
            
            .section.allow-break {
              page-break-inside: auto;
            }
            
            .usage-section {
              page-break-before: auto;
              page-break-inside: avoid;
            }
            
            .usage-table thead {
              display: table-header-group;
            }
            
            .usage-table tbody tr {
              page-break-inside: avoid;
            }
            
            .usage-table thead tr,
            .usage-table tbody tr:first-child {
              page-break-after: avoid;
            }
          }

          @page {
            margin: 15mm;
          }
          
          .page-break {
            display: block;
            page-break-before: always;
            page-break-after: always;
            break-before: page;
            break-after: page;
            height: 0;
            margin: 0;
            padding: 0;
            border: none;
          }
        </style>

      </head>
      <body>    
        <h1>Job Card Report</h1>

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
              <div class="col"><span class="label">Job Original Size:</span> <span class="input">${`${order.jobLength} * ${order.jobWidth}`}</span></div>
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

        <div id="printing-section" class="section allow-break">
          <div class="section-title">Printing</div>
          <div class="row">
            <div class="col"><span class="label">Printing Start Time:</span> <span class="input">${
              order.jobType === 'Plain' ? '' : printingStartTimeFormatted || ''
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
               <div class="col"><span class="label">Actual Required Material:</span> <span class="input">${
                 order.totalPaperRequired || ''
               } m</span></div>
         </div>

         ${generateStageUsageTable('printing')}
        </div>

        <div id="punching-section" class="section allow-break punching-section">
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
            <div class="col"><span class="label">Running Mtrs:</span> <span class="input">${
              order.runningMtr || ''
            }
            </span></div>
          </div>

          ${generateStageUsageTable('punching')}
        </div>

        <div id="slitting-section" class="section allow-break slitting-section">
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

          ${generateStageUsageTable('slitting')}
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
