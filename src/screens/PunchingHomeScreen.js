import React, {useEffect, useState} from 'react';
import {View, Text, FlatList, StyleSheet, Pressable} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import CustomHeader from '../components/CustomHeader';
import SearchBar from '../components/SearchBar';
import auth from '@react-native-firebase/auth';

const PunchingHomeScreen = ({route, navigation}) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('allJobs');
    const [searchQuery, setSearchQuery] = useState('');

  // Fetch orders assigned to Punching Operator
  useEffect(() => {
    const currentUser = auth().currentUser;
    if (!currentUser) return;

    const unsubscribe = firestore()
      .collection('orders')
      .where('assignedTo', '==', currentUser.uid)
      .where('jobStatus', '==', 'punching')

      .onSnapshot(
        snapshot => {
          const fetchedOrders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setOrders(fetchedOrders);
          setLoading(false);
        },
        error => {
          console.error('Error fetching orders: ', error);
          setLoading(false);
        },
      );

    return () => unsubscribe();
  }, []);


  const getFilteredJobs = () => {
    let filtered = orders;

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
        navigation.navigate('PunchingJobDetailsScreen', {order: item})
      }
      style={styles.row}>
      <Text style={styles.cell}>{item.jobCardNo}</Text>
      <Text style={styles.cell}>{item.customerName}</Text>
      <Text style={styles.cell}>{item.jobDate}</Text>
      <Text style={styles.statusCell}>{item.jobStatus}</Text>
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
        onDropdownSelect={(value) => setFilter(value)}
      />

      <View style={styles.homeSubContainer}>
      <SearchBar
          placeholder="Search Job"
          style={styles.searchBarHome}
          value={searchQuery}
          onChangeText={text => setSearchQuery(text)}
        />

        <View style={styles.tableHeadingTypesContainer}>
          <Text style={styles.tableHeadingTypesText}>Punching Jobs</Text>
        </View>

        <View style={styles.tableContainer}>
          {renderHeader()}
          {loading ? (
            <Text style={{textAlign: 'center', marginTop: 20}}>Loading...</Text>
          ) : (
            <FlatList
            data={getFilteredJobs()}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={{paddingBottom: 20}}
            />
          )}
        </View>
      </View>
    </View>
  );
};

export default PunchingHomeScreen;

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
    fontFamily:'Lato-Regular'
  },

  tableContainer: {
     maxHeight: 400,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    backgroundColor:'#fff'
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
    fontFamily:'Lato-Black'
  },
  cell: {
    width: 80,
    textAlign: 'center',
    height: 40,
    fontSize: 12,
    color: '#000',
    fontFamily:'Lato-Regular'
  },
  statusCell: {
    width: 80,
    textAlign: 'center',
    height: 40,
    color: '#ff0000',
    fontSize: 12,
    fontFamily:'Lato-Regular'
  },
});
