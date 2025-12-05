import React, {useEffect, useState} from 'react';
import {View, Text, ScrollView, StyleSheet} from 'react-native';
import CustomHeader from '../components/CustomHeader';
import CustomLabelTextInput from '../components/CustomLabelTextInput';
import CustomButton from '../components/CustomButton';
import CustomLabelText from '../components/CustomLabelText';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const NotificationScreen = () => {
  const [jobData, setJobData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('allJobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    fetchUserRole();
    const unsubscribe = firestore()
      .collection('ordersTest')
      .orderBy('createdAt', 'desc') // ✅ Sort newest first
      .onSnapshot(
        snapshot => {
          const fetchedJobs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setJobData(fetchedJobs);
          setLoading(false);
        },
        error => {
          console.error('Error fetching jobs: ', error);
          setLoading(false);
        },
      );
    return () => unsubscribe();
  }, []);

  const fetchUserRole = async () => {
    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
        const userDoc = await firestore()
          .collection('users')
          .doc(currentUser.uid)
          .get();
        if (userDoc.exists) {
          setRole(userDoc.data().role);
        } else {
          console.warn('User document not found');
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };
  const getFilteredJobs = () => {
    let filtered = jobData;

    if (filter !== 'allJobs') {
      filtered = filtered.filter(
        job =>
          job.jobStatus?.toLowerCase() ===
          filter.replace('Jobs', '').toLowerCase(),
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        job =>
          (job.jobCardNo && job.jobCardNo.toLowerCase().includes(query)) ||
          (job.customerName &&
            job.customerName.toLowerCase().includes(query)) ||
          (() => {
            if (!job.jobDate) return false;
            let jobDateObj;

            if (job.jobDate.toDate) {
              jobDateObj = job.jobDate.toDate();
            } else if (job.jobDate._seconds) {
              jobDateObj = new Date(job.jobDate._seconds * 1000);
            } else if (typeof job.jobDate === 'string') {
              jobDateObj = new Date(job.jobDate);
            } else {
              jobDateObj = job.jobDate;
            }

            return jobDateObj.toDateString().toLowerCase().includes(query);
          })(),
      );
    }

    if (fromDate || toDate) {
      filtered = filtered.filter(job => {
        let jobDate;

        if (job.jobDate?.toDate) {
          jobDate = job.jobDate.toDate();
        } else if (job.jobDate?._seconds) {
          jobDate = new Date(job.jobDate._seconds * 1000);
        } else if (typeof job.jobDate === 'string') {
          jobDate = new Date(job.jobDate);
        } else {
          jobDate = job.jobDate;
        }

        if (!(jobDate instanceof Date) || isNaN(jobDate)) return false;

        // Adjusted To-Date (end of day)
        const adjustedToDate = toDate
          ? new Date(toDate.setHours(23, 59, 59, 999))
          : null;

        if (fromDate && jobDate < fromDate) return false;
        if (adjustedToDate && jobDate > adjustedToDate) return false;

        return true;
      });
    }

    // 👇 Add this line — only include unaccepted jobs
    filtered = filtered.filter(job => job.accept === false);

    if (role && role.toLowerCase() !== 'admin') {
      filtered = filtered.filter(
        job => job.jobStatus?.toLowerCase() === role.toLowerCase(),
      );
    }
    return filtered;
  };

  const handleAccept = async jobId => {
    try {
      await firestore().collection('ordersTest').doc(jobId).update({
        accept: true,
      });
      console.log(`Job ${jobId} accepted.`);
    } catch (error) {
      console.error('Error accepting job:', error);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <CustomHeader
        showHeadingSection1Container={true}
        headingTitle={'Flexo Job Card'}
        showHeadingSection2Container={true}
        showHeadingTextContainer={true}
        showBackBtn={true}
      />
      <ScrollView>
        <View style={styles.subContainer}>
          {getFilteredJobs().length === 0 ? (
            <Text style={{color: 'gray', fontSize: 16, marginTop: 20}}>
              No unaccepted jobs found
            </Text>
          ) : (
            getFilteredJobs().map(item => {
              // Convert Firestore Timestamp → readable date/time
              let jobDate = '';
              let jobTime = '';
              if (item.jobDate?.toDate) {
                const d = item.jobDate.toDate();
                jobDate = d.toLocaleDateString('en-GB'); // e.g., 25/08/2024
                jobTime = d.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                }); // e.g., 04:57
              } else {
                jobDate = '—';
                jobTime = '—';
              }

              return (
                <View key={item.id} style={styles.cardBox}>
                  <CustomLabelText
                    label={'Job Card No :'}
                    Details={item.jobCardNo || '-'}
                  />
                  <CustomLabelText
                    label={'Job Name :'}
                    Details={item.jobName || '-'}
                  />
                  <CustomLabelText label={'Job Date :'} Details={jobDate} />
                  <CustomLabelText label={'Job Time :'} Details={jobTime} />

                  <CustomButton
                    style={styles.btnContainer}
                    title={'Accept'}
                    onPress={() => handleAccept(item.id)}
                  />
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
};
export default NotificationScreen;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  subContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  cardBox: {
    width: '100%',
    backgroundColor: '#f6f6f6',
    borderRadius: 10,
    alignItems: 'center',
    padding: 20,
    marginVertical: 20,
  },
  btnContainer: {
    width: '60%',
    marginTop: 20,
    backgroundColor: '#4ed966',
  },
});
