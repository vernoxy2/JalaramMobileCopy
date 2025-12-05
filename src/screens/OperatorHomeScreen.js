import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import CustomHeader from '../components/CustomHeader';
import SearchBar from '../components/SearchBar';
import auth from '@react-native-firebase/auth';
import CustomDropdown from '../components/CustomDropdown';
import {Dimensions} from 'react-native';

const OperatorHomeScreen = ({route, navigation}) => {
  const role = route?.params?.role || 'Operator';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('allJobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [printingStatusFilter, setPrintingStatusFilter] = useState('all');
  const [listHeight, setListHeight] = useState(0);

  const [screenInfo, setScreenInfo] = useState({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    isLandscape:
      Dimensions.get('window').width > Dimensions.get('window').height,
  });

  const maxTableHeight = screenInfo.isLandscape
    ? screenInfo.height * (isTablet ? 0.7 : 0.6)
    : screenInfo.height * (isTablet ? 0.5 : 0.4);
  const isTablet = screenInfo.width >= 768;

  useEffect(() => {
    const onChange = ({window}) => {
      setScreenInfo({
        width: window.width,
        height: window.height,
        isLandscape: window.width > window.height,
      });
    };
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  // Refs to persist job data across renders
  const pendingJobsRef = useRef([]);
  const completedJobsRef = useRef([]);

  // Fetch orders assigned to Printing Operator
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
      .collection('ordersTest')
      .where('assignedTo', '==', currentUser.uid)
      .where('jobStatus', '==', 'Printing')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        pendingJobsRef.current = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        updateCombinedJobs();
      });

    const unsubscribeCompleted = firestore()
      .collection('ordersTest')
      .where('printingStatus', '==', 'completed')
      .where('completedByPrinting', '==', currentUser.uid)
      .orderBy('updatedByPrintingAt', 'desc')
      .onSnapshot(
        snapshot => {
          if (!snapshot || !snapshot.docs) return;
          completedJobsRef.current = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          updateCombinedJobs();
        },
        error => {
          console.error('Firestore snapshot error (Pending):', error);
        },
      );

    return () => {
      unsubscribePending();
      unsubscribeCompleted();
    };
  }, []);

  const getFilteredJobs = () => {
    let filtered = orders;

    // 🧹 Exclude completed jobs from all results
    filtered = filtered.filter(job => job.printingStatus !== 'completed');

    if (filter === 'pendingJobs') {
      filtered = filtered.filter(job => job.jobStatus === 'Printing');
    } else if (filter === 'completedJobs') {
      filtered = filtered.filter(job => job.printingStatus === 'completed');
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job => {
        const jobCardMatch =
          job.jobCardNo && job.jobCardNo.toLowerCase().includes(query);
        const customerNameMatch =
          job.customerName && job.customerName.toLowerCase().includes(query);

        const jobNameMatch =
          job.jobName && job.jobName.toLowerCase().includes(query);
        let jobDateStr = '';
        if (job.jobDate?.toDate) {
          jobDateStr = job.jobDate.toDate().toDateString();
        } else if (job.jobDate?._seconds) {
          jobDateStr = new Date(job.jobDate._seconds * 1000).toDateString();
        } else if (typeof job.jobDate === 'string') {
          jobDateStr = job.jobDate;
        } else if (job.jobDate instanceof Date) {
          jobDateStr = job.jobDate.toDateString();
        }

        const dateMatch = jobDateStr
          ? jobDateStr.toLowerCase().includes(query)
          : false;

        return jobCardMatch || customerNameMatch || jobNameMatch || dateMatch;
      });
    }
    if (printingStatusFilter !== 'all') {
      filtered = filtered.filter(job => {
        const status = job.printingStatus
          ? job.printingStatus.toLowerCase()
          : 'pending';
        return status === printingStatusFilter.toLowerCase();
      });
    }

    return filtered;
  };

  const renderHeader = () => (
    <View style={[styles.row, styles.header]}>
      <Text style={styles.cellHeading}>Job Card No</Text>
      <Text style={styles.cellHeading}>Job Name</Text>
      <Text style={styles.cellHeading}>Customer Name</Text>
      <Text style={styles.cellHeading}>Date</Text>
      <Text style={styles.cellHeading}>Material Status</Text>
      <Text style={styles.cellHeading}>Job Status</Text>
      <Text style={styles.cellHeading}>Action</Text>
    </View>
  );

  const renderItem = ({item}) => (
    <Pressable
      onPress={() => navigation.navigate('OperatorCreateOrder', {order: item})}
      style={styles.row}>
      <Text style={styles.cell}>{item.jobCardNo}</Text>
      <Text style={styles.cell}>{item.jobName}</Text>
      <Text style={styles.cell}>{item.customerName}</Text>
      <Text style={styles.cell}>
        {item.jobDate
          ? item.jobDate.toDate
            ? item.jobDate.toDate().toDateString()
            : new Date(item.jobDate._seconds * 1000).toDateString()
          : ''}
      </Text>
      <Text
        style={[
          styles.statusCell,
          item.materialAllotStatus === 'alloted' ||
          item.materialAllotStatus === 'Alloted'
            ? styles.completedStatus
            : styles.pendingStatus,
        ]}>
        {item.materialAllotStatus === 'alloted' ||
        item.materialAllotStatus === 'Alloted'
          ? 'Alloted'
          : 'Pending'}
      </Text>
      <Text
        style={[
          styles.statusCell,
          item.printingStatus === 'completed'
            ? styles.completedStatus
            : item.printingStatus === 'started'
            ? styles.jobStartedStatus
            : styles.pendingStatus,
        ]}>
        {item.printingStatus === 'completed'
          ? 'Completed'
          : item.printingStatus === 'started'
          ? 'Started'
          : 'Pending'}
      </Text>
      <View
        style={[
          styles.cell,
          {width: 80, alignItems: 'center', justifyContent: 'center'},
        ]}>
        {item.jobStatus?.toLowerCase() !== 'completed' && (
          <Pressable
            pointerEvents="box-only"
            onStartShouldSetResponder={() => true}
            onPress={e => {
              e.stopPropagation();
              navigation.navigate('MaterialRequestPrinting', {
                id: item.id,
                isEdit: true,
              });
            }}
            style={styles.editButton}>
            <Text style={styles.editText}>Request Material</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );

  return (
    <View style={styles.homeMainContainer}>
      <CustomHeader
        showHeadingSection1Container={true}
        showHeadingTextContainer={true}
        headingTitle={'Printing Dashboard'}
        showHeadingSection2Container={true}
        btnHeading={'Create New'}
        showHeaderDropDown={true}
        onDropdownSelect={value => setFilter(value)}
      />

      <ScrollView
        contentContainerStyle={{flexGrow: 1, paddingBottom: 40}}
        showsVerticalScrollIndicator={true}>
        <View style={styles.homeSubContainer}>
          {/* 🔽 Printing Status Dropdown */}
          <CustomDropdown
            data={[
              {label: 'All', value: 'all'},
              {label: 'Started', value: 'started'},
              {label: 'Pending', value: 'pending'},
            ]}
            onSelect={item => setPrintingStatusFilter(item.value)}
            placeholder="Filter by Printing Status"
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
            <Text style={styles.tableHeadingTypesText}>Printing Jobs</Text>
          </View>

          <View>
            {loading ? (
              <ActivityIndicator size="large" color="#0000ff" />
            ) : getFilteredJobs().length > 0 ? (
              <View
                key={screenInfo.width} // ✅ re-renders when width changes
                style={[
                  styles.tableContainer,
                  {
                    width: isTablet ? '90%' : '100%',
                    alignSelf: isTablet ? 'center' : 'stretch',
                    maxHeight: screenInfo.isLandscape
                      ? screenInfo.height * (isTablet ? 0.7 : 0.6)
                      : screenInfo.height * (isTablet ? 0.5 : 0.4),
                  },
                ]}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  contentContainerStyle={{
                    justifyContent: isTablet ? 'center' : 'flex-start',
                    width: isTablet ? '100%' : 'auto',
                    minWidth: screenInfo.width, // 👈 ensures content always fills full screen width
                  }}>
                  <View
                    style={[
                      styles.tableContainer1,
                      {
                        maxHeight: screenInfo.isLandscape
                          ? screenInfo.height * (isTablet ? 0.7 : 0.6)
                          : screenInfo.height * (isTablet ? 0.5 : 0.4),
                      },
                    ]}>
                    {renderHeader()}
                    <FlatList
                      data={getFilteredJobs()}
                      renderItem={renderItem}
                      keyExtractor={item => item.id}
                      contentContainerStyle={{paddingBottom: 20}}
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}
                      persistentScrollbar={true}
                      extraData={screenInfo}
                      // onContentSizeChange={(w, h) => setListHeight(h)}
                      onContentSizeChange={(w, h) => {
                        // Only update if height difference > 5px
                        setListHeight(prev =>
                          Math.abs(prev - h) > 5 ? h : prev,
                        );
                      }}
                      style={{
                        maxHeight: maxTableHeight,
                        height:
                          listHeight < maxTableHeight
                            ? listHeight
                            : maxTableHeight,
                      }}
                    />
                  </View>
                </ScrollView>
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
                  You're all caught up! No printing jobs are assigned to you
                  right now.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default OperatorHomeScreen;

// const screen = Dimensions.get('window');
// const isTablet = screen.width > 768; // Adjust breakpoint if needed

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
    minWidth: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    backgroundColor: '#fff',
    alignSelf: 'center',
    // width: isTablet ? '90%' : '100%',
  },
  tableContainer1: {
    maxHeight: '100%',
    minWidth: '100%',
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
    width: 100,
    textAlign: 'center',
    fontSize: 12,
    color: '#fff',
    fontFamily: 'Lato-Black',
  },
  cell: {
    width: 100,
    textAlign: 'center',
    fontSize: 12,
    color: '#000',
    fontFamily: 'Lato-Regular',
  },
  statusCell: {
    width: 100,
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
  jobStartedStatus: {
    color: '#3668B1',
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
  editButton: {
    backgroundColor: '#3668B1',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  editText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Lato-Bold',
  },
});
