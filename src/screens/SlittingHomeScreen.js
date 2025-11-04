import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import CustomHeader from '../components/CustomHeader';
import SearchBar from '../components/SearchBar';
import CustomDropdown from '../components/CustomDropdown';

const SlittingHomeScreen = ({navigation}) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('allJobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [slittingStatusFilter, setSlittingStatusFilter] = useState('all');

  const pendingJobsRef = useRef([]);
  const completedJobsRef = useRef([]);

  useEffect(() => {
    const currentUser = auth().currentUser;
    if (!currentUser) return;

    const updateCombinedJobs = () => {
      const combined = [...pendingJobsRef.current, ...completedJobsRef.current];
      const unique = Array.from(
        new Map(combined.map(job => [job.id, job])).values(),
      );
      setOrders(unique);
      setLoading(false);
    };

    const unsubscribePending = firestore()
      .collection('orders')
      .where('assignedTo', '==', currentUser.uid)
      .where('jobStatus', '==', 'Slitting')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        pendingJobsRef.current = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        updateCombinedJobs();
      });

    const unsubscribeCompleted = firestore()
      .collection('orders')
      .where('slittingStatus', '==', 'completed')
      .where('completedBySlitting', '==', currentUser.uid)
      .orderBy('updatedBySlittingAt', 'desc')
      .onSnapshot(snapshot => {
        completedJobsRef.current = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        updateCombinedJobs();
      });

    return () => {
      unsubscribePending();
      unsubscribeCompleted();
    };
  }, []);

  const getFilteredJobs = () => {
    let filtered = orders;

    // 🧹 Exclude completed jobs from all results
    filtered = filtered.filter(job => job.slittingStatus !== 'completed');

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

            let jobDateStr = '';

            if (job.jobDate.toDate) {
              // Firebase Timestamp
              jobDateStr = job.jobDate.toDate().toDateString();
            } else if (job.jobDate._seconds) {
              // Alternative Firebase Timestamp shape
              jobDateStr = new Date(job.jobDate._seconds * 1000).toDateString();
            } else if (typeof job.jobDate === 'string') {
              jobDateStr = job.jobDate;
            } else if (job.jobDate instanceof Date) {
              jobDateStr = job.jobDate.toDateString();
            }

            return jobDateStr.toLowerCase().includes(query);
          })(),
      );
    }
    if (slittingStatusFilter !== 'all') {
      filtered = filtered.filter(job => {
        const status = job.slittingStatus
          ? job.slittingStatus.toLowerCase()
          : 'pending';
        return status === slittingStatusFilter.toLowerCase();
      });
    }

    return filtered;
  };

  const renderHeader = () => (
    <View style={[styles.row, styles.header]}>
      <Text style={styles.cellHeading}>Job Card No</Text>
      <Text style={styles.cellHeading}>Name</Text>
      <Text style={styles.cellHeading}>Date</Text>
      <Text style={styles.cellHeading}>Status</Text>
    </View>
  );

  const renderItem = ({item}) => (
    <Pressable
      onPress={() =>
        navigation.navigate('SlittingJobDetailsScreen', {order: item})
      }
      style={styles.row}>
      <Text style={styles.cell}>{item.jobCardNo}</Text>
      <Text style={styles.cell}>{item.customerName}</Text>
      <Text style={styles.cell}>
        {item.jobDate
          ? item.jobDate.toDate
            ? item.jobDate.toDate().toDateString()
            : new Date(item.jobDate._seconds * 1000).toDateString()
          : ''}
      </Text>
      {/* <Text
        style={[
          styles.statusCell,
          item.slittingStatus === 'completed' || item.isCompleted
            ? styles.completedStatus
            : styles.pendingStatus,
        ]}>
        {item.slittingStatus || (item.isCompleted ? 'completed' : 'pending')}
      </Text> */}
      <Text
        style={[
          styles.statusCell,
          item.slittingStatus === 'completed'
            ? styles.completedStatus
            : item.slittingStatus === 'started'
            ? {color: '#3668B1'}
            : styles.pendingStatus,
        ]}>
        {item.slittingStatus || 'pending'}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <CustomHeader
        showHeadingSection1Container
        showHeadingTextContainer
        headingTitle="Slitting Dashboard"
        showHeadingSection2Container
        btnHeading="Create New"
        showHeaderDropDown={true}
        onDropdownSelect={value => setFilter(value)}
      />

      <View style={styles.homeSubContainer}>
        <CustomDropdown
          data={[
            {label: 'All', value: 'all'},
            {label: 'Started', value: 'started'},
            {label: 'Pending', value: 'pending'},
          ]}
          onSelect={item => setSlittingStatusFilter(item.value)}
          placeholder="Filter by Slitting Status"
          showIcon={true}
          style={styles.dropdownContainer}
        />
        <SearchBar
          placeholder="Search Job"
          style={styles.searchBarHome}
          value={searchQuery}
          onChangeText={text => setSearchQuery(text)}
        />

        <View style={styles.tableHeadingTypesContainer}>
          <Text style={styles.tableHeadingTypesText}>Slitting Jobs</Text>
        </View>

        <View>
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : getFilteredJobs().length > 0 ? (
            <View style={styles.tableContainer}>
              {renderHeader()}
              <FlatList
                data={getFilteredJobs()}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{paddingBottom: 20}}
              />
            </View>
          ) : (
            <View style={styles.noJobsContainer}>
              <Image
                source={require('../assets/images/listing.png')}
                style={styles.noJobsImage}
                resizeMode="contain"
              />
              <Text style={styles.noJobsTitle}>No Jobs Available</Text>
              <Text style={styles.noJobsSubtitle}>
                You're all caught up! No slitting jobs are assigned to you right
                now.
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  homeMainContainer: {
    height: '100%',
    width: '100%',
    backgroundColor: '#fff',
  },
  searchBarHome: {
    backgroundColor: '#f6f6f6',
  },
  homeSubContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  tableHeadingTypesContainer: {
    alignItems: 'center',
    backgroundColor: '#f6f6f6',
    height: 50,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginVertical: 20,
    justifyContent: 'center',
  },

  tableHeadingTypesText: {
    fontSize: 18,
    color: '#000',
    fontFamily: 'Lato-Regular',
  },

  tableContainer: {
    maxHeight: 340,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingVertical: 20,
    display: 'flex',
    paddingHorizontal: 4,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  header: {
    backgroundColor: '#3668B1',
  },
  cellHeading: {
    width: 80,
    textAlign: 'center',
    fontSize: 12,
    color: '#fff',
    fontFamily: 'Lato-Black',
  },
  cell: {
    width: 80,
    textAlign: 'center',
    height: 40,
    fontSize: 12,
    color: '#000',
    fontFamily: 'Lato-Regular',
  },
  statusCell: {
    width: 80,
    textAlign: 'center',
    height: 40,
    color: '#ff0000',
    fontSize: 12,
    fontFamily: 'Lato-Bold',
  },
  completedStatus: {
    color: 'green',
  },
  pendingStatus: {
    color: 'red',
  },
  noJobsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },

  noJobsImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
    opacity: 0.8,
  },

  noJobsTitle: {
    fontSize: 20,
    fontFamily: 'Lato-Bold',
    color: '#333',
    marginBottom: 8,
  },

  noJobsSubtitle: {
    fontSize: 14,
    fontFamily: 'Lato-Regular',
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
    dropdownContainer: {
    width: '100%',
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 20,
    height: 40,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
});

export default SlittingHomeScreen;
