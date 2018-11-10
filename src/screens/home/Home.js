import React from "react";
import moment from 'moment';
import { ScrollView, View, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import { Text, Button } from "native-base";
import { API, graphqlOperation, Auth } from "aws-amplify";

export default class Home extends React.Component {
  static navigationOptions = {
    title: 'JioJio',
  }
  constructor(props) {
    super(props);
    this.state = {
      events: [],
      isLoading: true,
      user: {},
    }
  }
  componentDidMount() {
    this.getUser();
    this.getAllEvents();
  }
  refreshEvents = () => {
    this.setState({
      isLoading: true,
    });
    this.getAllEvents();
  }
  getUser = async () => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      this.setState({
        user: user,
        accessToken: user.signInUserSession.accessToken.jwtToken.substring(0, 10)
      });
      this.getUserInfo()
    } catch (err) {
      console.log(err);
    }
  }
  getUserInfo = async () => {
    let userInfo = await Auth.currentUserInfo();
    const { id, username } = userInfo
    const { email, phone_number } = userInfo.attributes
    // console.log(id, username, email, phone_number);

    const CreateUserMutation = `mutation createUser {
      createUser(input:{
        email: "${email}"
        name: "${username}"
        phone_number: "${phone_number}"
        username: "${username}"
      }) {
        id
      }
    }`;

    try {
      await API.graphql(graphqlOperation(CreateUserMutation));
    }
    catch (e) {
      console.log(e)
    }
  }
  getAllEvents = async () => {
    // TODO: create a query to list all events
    const AllEventsQuery = ``;

    try {
      var response = await API.graphql(graphqlOperation(AllEventsQuery));
    }
    catch (e) {
      // var accessToken = signInUserSession.accessToken.jwtToken;
      console.log(e)
    }
    this.setState({
      events: response.data.listEvents.items,
      isLoading: false,
    });
  }
  renderLoadingIndicator = () => {
    let { isLoading } = this.state;
    if (!isLoading) {
      return;
    }
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', margin: 5 }}>
        <ActivityIndicator size="large" color="#330066" animating />
      </View>
    )
  }
  renderEvent = ({ item }) => {
    return (
      <TouchableOpacity style={{ borderColor: '#333333', borderWidth: 1, margin: 10 }} onPress={() => this.handleViewEvent(item)}>
        {this.state.user.sub == item.eventUserId ? (
          <View style={{ flex: 1, width: '100%', height: 20, backgroundColor: '#ffb900' }}></View>
        ) : (
            <View style={{ flex: 1, width: '100%', height: 20, backgroundColor: '#000' }}></View>
          )}
        <View style={{ padding: 10 }}>
          {this.state.user.sub == item.eventUserId ? (
            <Text style={{ fontSize: 24, fontWeight: '700' }}>🤡 {item.title}</Text>
          ) : (
              <Text style={{ fontSize: 24, fontWeight: '700' }}>{item.title}</Text>
            )}

          <Text>by: {item.user.username}</Text>
          <Text style={{ fontSize: 12, marginTop: 5 }}>{item.description}</Text>
          <Text style={{ fontSize: 16, fontWeight: '100', marginTop: 5 }}>{moment.unix(item.startAt).calendar()}</Text>
        </View>
      </TouchableOpacity>
    )
  }
  renderEvents = () => {
    let { events } = this.state;
    if (!events) {
      return;
    }
    //sort events by DateTimeStart
    events.sort(function (a, b) { return a.DateTimeStart - b.DateTimeStart });
    return (
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={this.renderSeparator}
        renderItem={this.renderEvent}
      />
    )
  }
  renderSeparator = () => {
    return (
      <View style={{ height: 1, width: null, backgroundColor: '#eeeeee' }}></View>
    );
  }
  handleNewEvent = () => {
    this.props.navigation.push("Create", {
      updateHomeEvents: this.refreshEvents.bind(this),
    });
  }
  handleViewEvent = (event) => {
    let { user } = this.state;
    this.props.navigation.navigate("EventDetail", {
      event: event,
      user: user,
      updateHomeEvents: this.refreshEvents.bind(this),
    });
  }
  render() {
    return (
      <ScrollView scrollEventThrottle={16} style={{ backgroundColor: 'white', flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: 20, paddingVertical: 10 }}>
          <Text style={{ fontSize: 24, fontWeight: '700' }}>Hi {this.state.user.username}, hungry to meet new friends?</Text>
          <Text style={{ fontSize: 12, marginTop: 10 }}>Click "Create Event" to begin</Text>
          <View style={{
            paddingHorizontal: 10, margin: 10, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center'
          }}>
            <Button primary rounded onPress={() => this.handleNewEvent()}>
              <Text>Create</Text>
            </Button>
            <Button light block rounded onPress={() => this.refreshEvents()}>
              <Text>Refresh</Text>
            </Button>
          </View>
          <Text style={{ fontSize: 24, fontWeight: '700' }}>
            Don't say boh jio
          </Text>
          <Text style={{ fontSize: 12, fontWeight: '100' }}>
            Join, Rate and Chat about meetups
          </Text>
        </View>
        <View>
          {this.renderLoadingIndicator()}
          {this.renderEvents()}
        </View>
      </ScrollView>
    );
  }
}