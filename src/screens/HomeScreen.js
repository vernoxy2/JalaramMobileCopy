import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  ScrollView,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import CustomHeader from '../components/CustomHeader';
import SearchBar from '../components/SearchBar';
import DatePicker from 'react-native-date-picker';
import {Dimensions} from 'react-native';

const HomeScreen = ({navigation}) => {
  const [jobData, setJobData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('allJobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [openFrom, setOpenFrom] = useState(false);
  const [openTo, setOpenTo] = useState(false);
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

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('orders')
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
          (job.jobName && job.jobName.toLowerCase().includes(query)) ||
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

    return filtered;
  };

  const renderHeader = () => (
    <View style={[styles.row, styles.header]}>
      <Text style={styles.cellHeading}>Job Card No</Text>
      <Text style={styles.cellHeading}>Job Name</Text>
      <Text style={styles.cellHeading}>Customer Name</Text>
      <Text style={styles.cellHeading}>Date</Text>
      <Text style={styles.cellHeading}>Status</Text>
      <Text style={styles.cellHeading}>Action</Text>
    </View>
  );

  const renderItem = ({item}) => (
    <Pressable
      onPress={() =>
        navigation.navigate('AdminJobDetailsScreen', {order: item})
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
      <Text
        style={[
          styles.cell,
          item.jobStatus?.toLowerCase() === 'completed'
            ? styles.completedStatus
            : styles.pendingStatus,
        ]}>
        {item.jobStatus}
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
              navigation.navigate('AdminCreateOrder', {
                id: item.id,
                isEdit: true,
              });
            }}
            style={styles.editButton}>
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={{flexGrow: 1, paddingBottom: 40}}
          showsVerticalScrollIndicator={true}>
          <View style={styles.homeMainContainer}>
            <CustomHeader
              showHeadingSection1Container={true}
              showHeadingTextContainer={true}
              headingTitle={'Dashboard'}
              showHeadingSection2Container={true}
              onPress={() => navigation.navigate('AdminCreateOrder')}
              showHeaderBtn={true}
              btnHeading={'Create New'}
              showHeaderDropDown={true}
              onDropdownSelect={value => setFilter(value)}
            />
            <View style={styles.homeSubContainer}>
              <SearchBar
                placeholder="Search Job"
                style={styles.searchBarHome}
                value={searchQuery}
                onChangeText={text => setSearchQuery(text)}
              />

              <View style={styles.dateFilterContainer}>
                <Pressable
                  onPress={() => setOpenFrom(true)}
                  style={styles.dateFilterButton}>
                  <Text style={styles.dateFilterText}>
                    {fromDate ? fromDate.toDateString() : 'From Date'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setOpenTo(true)}
                  style={styles.dateFilterButton}>
                  <Text style={styles.dateFilterText}>
                    {toDate ? toDate.toDateString() : 'To Date'}
                  </Text>
                </Pressable>
              </View>

              <DatePicker
                modal
                open={openFrom}
                date={fromDate || new Date()}
                mode="date"
                maximumDate={new Date()}
                // onConfirm={date => {
                //   setOpenFrom(false);
                //   setFromDate(date);
                // }}
                onConfirm={date => {
                  setOpenFrom(false);
                  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
                  setFromDate(startOfDay);
                }}
                onCancel={() => setOpenFrom(false)}
              />

              <DatePicker
                modal
                open={openTo}
                date={toDate || new Date()}
                mode="date"
                maximumDate={new Date()}
                minimumDate={fromDate || undefined}
                // onConfirm={date => {
                //   setOpenTo(false);
                //   setToDate(date);
                // }}
                onConfirm={date => {
                  setOpenTo(false);
                  const endOfDay = new Date(date.setHours(23, 59, 59, 999));
                  setToDate(endOfDay);
                }}
                onCancel={() => setOpenTo(false)}
              />

              <View style={styles.tableHeadingTypesContainer}>
                <Text style={styles.tableHeadingTypesText}>All Jobs</Text>
              </View>
              <View>
                {loading ? (
                  <ActivityIndicator
                    size="large"
                    color="#0000ff"
                    style={{marginTop: 20}}
                  />
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
                        flexDirection: 'column',
                        minWidth: 600, // ✅ Ensures all 6 columns fit
                        alignItems: 'flex-start',
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
                      You're all caught up! {'\n'}No such jobs are available.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default HomeScreen;
const screen = Dimensions.get('window');
const isTablet = screen.width > 768; // Adjust breakpoint if needed

const styles = StyleSheet.create({
  // Your existing styles
  homeMainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchBarHome: {
    backgroundColor: '#f6f6f6',
  },
  homeSubContainer: {
    flex: 1,
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
    // justifyContent: 'flex-start',
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
  dateFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    marginVertical: 10,
  },
  dateFilterButton: {
    width: '45%',
    padding: 10,
    backgroundColor: '#f6f6f6',
    borderRadius: 6,
    alignItems: 'center',
  },
  dateFilterText: {
    color: '#000',
    fontSize: 14,
    fontFamily: 'Lato-Regular',
  },
  editButton: {
    backgroundColor: '#3668B1',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  editText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Lato-Bold',
  },
  editButtonContainer: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3668B1', // ✅ visible color
    paddingVertical: 8,
    borderRadius: 6,
  },
});
