import React, {useEffect, useState, useRef, useCallback} from 'react';
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
import {useFocusEffect} from '@react-navigation/native';

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
  
  useFocusEffect(
    useCallback(() => {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.log('❌ No current user found');
        setLoading(false);
        return;
      }

      console.log('✅ Current User UID:', currentUser.uid);

      const updateCombinedJobs = () => {
        const mergedMap = new Map();

        // Completed first so it overwrites older pending data
        const combined = [
          ...completedJobsRef.current,
          ...pendingJobsRef.current,
        ];

        combined.forEach(job => {
          const existing = mergedMap.get(job.id);

          const jobUpdated =
            job.updatedByPrintingAt?._seconds || job.updatedAt?._seconds || 0;

          const existingUpdated =
            existing?.updatedByPrintingAt?._seconds ||
            existing?.updatedAt?._seconds ||
            0;

          if (!existing || jobUpdated >= existingUpdated) {
            mergedMap.set(job.id, job);
          }
        });

        setOrders(Array.from(mergedMap.values()));
        setLoading(false);
      };

      // ✅ FIXED: Removed .orderBy() to avoid index requirement
      const unsubscribePending = firestore()
        .collection('ordersTest')
        .where('assignedTo', '==', currentUser?.uid)
        .where('jobStatus', '==', 'Printing')
        .onSnapshot(
          snapshot => {
            if (!snapshot || !snapshot.docs) {
              console.log('⚠️ No pending snapshot');
              pendingJobsRef.current = [];
              updateCombinedJobs();
              return;
            }

            console.log('📥 Pending jobs received:', snapshot.docs.length);

            // Map and sort in memory
            pendingJobsRef.current = snapshot.docs
              .map(doc => {
                const data = doc.data();
                console.log('📄 Job:', doc.id, {
                  jobCardNo: data.jobCardNo,
                  assignedTo: data.assignedTo,
                  jobStatus: data.jobStatus,
                  printingStatus: data.printingStatus,
                  materialAllotStatus: data.materialAllotStatus,
                });
                return {
                  id: doc.id,
                  ...data,
                };
              })
              .sort((a, b) => {
                // Sort by createdAt descending (newest first)
                const aTime = a.createdAt?._seconds || 0;
                const bTime = b.createdAt?._seconds || 0;
                return bTime - aTime;
              });

            updateCombinedJobs();
          },
          error => {
            console.error('❌ Pending jobs error:', error);
            setLoading(false);
          },
        );

      // ✅ FIXED: Removed .orderBy() to avoid index requirement
      const unsubscribeCompleted = firestore()
        .collection('ordersTest')
        .where('printingStatus', '==', 'completed')
        .where('completedByPrinting', '==', currentUser.uid)
        .onSnapshot(
          snapshot => {
            if (!snapshot || !snapshot.docs) {
              console.log('⚠️ No completed snapshot');
              completedJobsRef.current = [];
              updateCombinedJobs();
              return;
            }

            console.log('✅ Completed jobs received:', snapshot.docs.length);

            // Map and sort in memory
            completedJobsRef.current = snapshot.docs
              .map(doc => ({
                id: doc.id,
                ...doc.data(),
              }))
              .sort((a, b) => {
                // Sort by updatedByPrintingAt descending (newest first)
                const aTime = a.updatedByPrintingAt?._seconds || 0;
                const bTime = b.updatedByPrintingAt?._seconds || 0;
                return bTime - aTime;
              });

            updateCombinedJobs();
          },
          error => {
            console.error('❌ Completed jobs error:', error);
            setLoading(false);
          },
        );

      // Cleanup when screen unfocuses
      return () => {
        unsubscribePending();
        unsubscribeCompleted();
      };
    }, []),
  );
  const getFilteredJobs = () => {
    let filtered = orders;

    console.log('🔍 Filtering jobs - Total:', filtered.length);

    // ✅ FIXED: Only exclude completed jobs when filter is NOT 'completedJobs'
    if (filter !== 'completedJobs') {
      filtered = filtered.filter(job => job.printingStatus !== 'completed');
      console.log('After completed filter:', filtered.length);
    }

    if (filter === 'pendingJobs') {
      filtered = filtered.filter(
        job =>
          job.jobStatus === 'Printing' && job.printingStatus !== 'completed',
      );
      console.log('Pending jobs only:', filtered.length);
    } else if (filter === 'completedJobs') {
      filtered = filtered.filter(job => job.printingStatus === 'completed');
      console.log('Completed jobs only:', filtered.length);
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
      console.log('After search filter:', filtered.length);
    }

    if (printingStatusFilter !== 'all') {
      filtered = filtered.filter(job => {
        const status = job.printingStatus
          ? job.printingStatus.toLowerCase()
          : 'pending';
        return status === printingStatusFilter.toLowerCase();
      });
      console.log('After status filter:', filtered.length);
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

  const renderItem = ({item}) => {
    const materialStatus = (item.materialAllotStatus || '')
      .toString()
      .trim()
      .toLowerCase();

    const isAllocated = ['allocated', 'allotted', 'alloted'].includes(
      materialStatus,
    );

    console.log(item);

    const printingStatus = (item.printingStatus || '')
      .toString()
      .trim()
      .toLowerCase();

    return (
      <Pressable
        onPress={() =>
          navigation.navigate('OperatorCreateOrder', {order: item})
        }
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

        {/* Material Status */}
        <Text
          style={[
            styles.statusCell,
            isAllocated ? styles.completedStatus : styles.pendingStatus,
          ]}>
          {isAllocated ? 'Allocated' : 'Pending'}
        </Text>

        {/* Printing Status */}
        <Text
          style={[
            styles.statusCell,
            printingStatus === 'completed'
              ? styles.completedStatus
              : printingStatus === 'started'
              ? styles.jobStartedStatus
              : styles.pendingStatus,
          ]}>
          {printingStatus === 'completed'
            ? 'Completed'
            : printingStatus === 'started'
            ? 'Started'
            : 'Pending'}
        </Text>

        {/* Request Button */}
        <View style={[styles.cell, {width: 80, alignItems: 'center'}]}>
          {item.jobStatus?.toLowerCase() !== 'completed' && (
            <Pressable
              pointerEvents="box-only"
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
  };

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
                key={screenInfo.width}
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
                    minWidth: screenInfo.width,
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
                      onContentSizeChange={(w, h) => {
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
