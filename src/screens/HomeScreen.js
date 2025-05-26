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
  Image
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import CustomHeader from '../components/CustomHeader';
import SearchBar from '../components/SearchBar';

const HomeScreen = ({navigation}) => {
  const [jobData, setJobData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('allJobs');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('orders')
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
          (job.jobDate && job.jobDate.toLowerCase().includes(query)),
      );
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
        navigation.navigate('AdminJobDetailsScreen', {order: item})
      }
      style={styles.row}>
      <Text style={styles.cell}>{item.jobCardNo}</Text>
      <Text style={styles.cell}>{item.customerName}</Text>
      <Text style={styles.cell}>{item.jobDate}</Text>
      <Text style={styles.statusCell}>{item.jobStatus}</Text>
    </Pressable>
  );

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
              ) :  getFilteredJobs().length > 0 ?  (
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
                                You're all caught up! {'\n'}No such jobs are available.
                              </Text>
                            </View>
              )}
            </View>


            
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default HomeScreen;

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
    // flex: 1,
    maxHeight:340,
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
    fontSize: 12,
    fontFamily: 'Lato-Regular',
  },
  statusCell: {
    width: 80,
    textAlign: 'center',
    color: '#ff0000',
    fontSize: 12,
    fontFamily: 'Lato-Regular',
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
});
