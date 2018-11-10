import React from "react";
import { API, graphqlOperation } from 'aws-amplify';
import { GiftedChat } from 'react-native-gifted-chat'

export default class ChatRoom extends React.Component {

  static navigationOptions = ({ navigation }) => ({
    title: `${navigation.state.params.event.title}`,
  });
  constructor(props) {
    super(props);
    let { event, user } = this.props.navigation.state.params;
    console.log(user);
    this.state = {
      event: event,
      messages: [],
      isLoading: true,
      user: user,
      newMessage: "",
    }
  }
  componentDidMount() {
    let { event } = this.state;
    this.getChatByEventId(event.id);
    this.subscribeToChatByEventId(event.id);
  }
  componentWillUnmount() {
    try {
      if (this.subscription !== null) {
        this.subscription.unsubscribe();
      }
    } catch (error) {
      console.log(error);
    }
  }
  formatToGiftedMessage = (msg) => {
    return {
      _id: msg.id,
      text: msg.content,
      createdAt: Date.parse(msg.createdAt),
      user: {
        _id: msg.user.username,
        name: msg.user.username,
        avatar: 'https://placeimg.com/140/140/any',
      }
    }
  }
  formatRawMessagesToGiftedMessages = (rawMessages) => {
    let this2 = this;
    return rawMessages.map(function (msg) {
      return this2.formatToGiftedMessage(msg);
    });
  }
  getChatByEventId = async (eventId) => {
    const getChatsByEventId = `query getEvent{
      getEvent(id:"${eventId}") {
        chats{
          items{
            id
            content
            user{
              id
              username
            }
            createdAt
          }
        }
      }
    }`;
    var response = await API.graphql(graphqlOperation(getChatsByEventId));
    var rawMessages = response.data.getEvent.chats.items;
    rawMessages.sort(function (a, b) {
      return (Date.parse(a.CreateAt) <= Date.parse(b.CreateAt)) ? 1 : -1;
    });
    this.appendToGiftedMessage(
      this.formatRawMessagesToGiftedMessages(rawMessages)
    );
  }
  subscribeToChatByEventId = async (eventId) => {
    // TODO: create a subscription to subscribe to new message
    const subscribeToNewChat = ``;
    try {
      let this2 = this;
      const subscription = API.graphql(graphqlOperation(subscribeToNewChat)).subscribe({
        next: (response) => {
          let newMessageFromResponse = response.value.data.onCreateChat;
          console.log(newMessageFromResponse);
          if (newMessageFromResponse.event.id === eventId) {
            this.appendToGiftedMessage([
              this2.formatToGiftedMessage(newMessageFromResponse)
            ]);
          }
        }
      });
      this.subscription = subscription;
    } catch (error) {
      console.log(error);
    }
  }
  saveMessage = async (text) => {
    let { event, user } = this.state;
    const CreateEventMutation = `mutation createChat {
      createChat(input:{
        chatUserId: "${user.attributes.sub}"
        chatEventId: "${event.id}"
        content: "${text}"
      }) {
        id
        content
        event {
          id
        }
        user {
          id
          username
        }
        createdAt
      }
    }`;

    try {
      await API.graphql(graphqlOperation(CreateEventMutation));
      this.setCurrentText("");
    } catch (e) {
      console.log(e)
    }
  }
  setCurrentText = (text) => {
    this.setState({ newMessage: text });
  }
  onSend = (newMessages = []) => {
    // this.appendToGiftedMessage(newMessages);
    this.saveMessage(this.state.newMessage);
  }
  appendToGiftedMessage = (newMessages) => {
    this.setState(previousState => ({
      messages: GiftedChat.append(
        previousState.messages,
        newMessages
      ),
    }));
  }
  render() {
    let { user } = this.state;
    return (
      <GiftedChat
        textInputProps={{ autoFocus: true }}
        messages={this.state.messages}
        inverted={true}
        alwaysShowSend={true}
        loadEarlier={false}
        onSend={messages => this.onSend(messages)}
        onInputTextChanged={text => this.setCurrentText(text)}
        user={{
          _id: user.username,
        }}
      />
    );
  }
}