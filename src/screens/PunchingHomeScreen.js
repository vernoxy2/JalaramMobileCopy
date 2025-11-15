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

const PunchingHomeScreen = ({navigation}) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('allJobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [punchingStatusFilter, setPunchingStatusFilter] = useState('all');
  const [listHeight, setListHeight] = useState(0);

  const pendingJobsRef = useRef([]);
  const completedJobsRef = useRef([]);

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
      .where('jobStatus', '==', 'Punching')
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
      .where('punchingStatus', '==', 'completed')
      .where('completedByPunching', '==', currentUser.uid)
      .orderBy('updatedByPunchingAt', 'desc')
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

  // Filter function remains mostly same, just maybe add handling for completed flag
  const getFilteredJobs = () => {
    let filtered = orders;
    // 🧹 Exclude completed jobs from all results
    filtered = filtered.filter(job => job.punchingStatus !== 'completed');

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
          (job.jobName && job.jobName.toLowerCase().includes(query)) ||
          (() => {
            if (!job.jobDate) return false;

            let jobDateStr = '';

            if (job.jobDate.toDate) {
              jobDateStr = job.jobDate.toDate().toDateString();
            } else if (job.jobDate._seconds) {
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
    if (punchingStatusFilter !== 'all') {
      filtered = filtered.filter(job => {
        const status = job.punchingStatus
          ? job.punchingStatus.toLowerCase()
          : 'pending';
        return status === punchingStatusFilter.toLowerCase();
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
      <Text style={styles.cellHeading}>Status</Text>
    </View>
  );

  const renderItem = ({item}) => (
    <Pressable
      onPress={() =>
        navigation.navigate('PunchingJobDetailsScreen', {order: item})
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
      {/* <Text
        style={[
          styles.statusCell,
          item.punchingStatus === 'completed' || item.isCompleted
            ? styles.completedStatus
            : styles.pendingStatus,
        ]}>
        {item.punchingStatus || (item.isCompleted ? 'completed' : 'pending')}
      </Text> */}
      <Text
        style={[
          styles.statusCell,
          item.punchingStatus === 'completed'
            ? styles.completedStatus
            : item.punchingStatus === 'started'
            ? {color: '#3668B1'}
            : styles.pendingStatus,
        ]}>
        {item.punchingStatus === 'started'
          ? 'started'
          : item.punchingStatus === 'completed'
          ? 'completed'
          : 'pending'}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.homeMainContainer}>
      <CustomHeader
        showHeadingSection1Container={true}
        showHeadingTextContainer={true}
        headingTitle={'Punching Dashboard'}
        showHeadingSection2Container={true}
        btnHeading={'Create New'}
        showHeaderDropDown={true}
        onDropdownSelect={value => setFilter(value)}
      />
      <ScrollView
        contentContainerStyle={{flexGrow: 1, paddingBottom: 40}}
        showsVerticalScrollIndicator={true}>
        <View style={styles.homeSubContainer}>
          <CustomDropdown
            data={[
              {label: 'All', value: 'all'},
              {label: 'Started', value: 'started'},
              {label: 'Pending', value: 'pending'},
            ]}
            onSelect={item => setPunchingStatusFilter(item.value)}
            placeholder="Filter by Punching Status"
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
            <Text style={styles.tableHeadingTypesText}>Punching Jobs</Text>
          </View>

          <View>
            {loading ? (
              <ActivityIndicator size="large" color="#0000ff" />
            ) : getFilteredJobs().length > 0 ? (
              // <View style={styles.tableContainer}>
              //   {renderHeader()}
              //   <FlatList
              //     data={getFilteredJobs()}
              //     renderItem={renderItem}
              //     keyExtractor={item => item.id}
              //     contentContainerStyle={{paddingBottom: 20}}
              //   />
              // </View>
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
                      extraData={screenInfo.width}
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
                  You're all caught up! No punching jobs are assigned to you
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

export default PunchingHomeScreen;

const screen = Dimensions.get('window');
const isTablet = screen.width > 768; // Adjust breakpoint if needed

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
    width: isTablet ? '90%' : '100%',
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
