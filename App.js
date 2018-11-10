import React from 'react';
import { Container } from 'native-base';
import { AppLoading, Font } from 'expo';

import RootNavigator from './src/Tabs';

import Amplify from 'aws-amplify';
import aws_exports from './aws-exports';
import { withAuthenticator } from 'aws-amplify-react-native';
Amplify.configure(aws_exports);

class App extends React.Component {
  state = {
    isReady: false
  };
  componentWillMount() {
    this.loadFonts();
  }
  async loadFonts() {
    await Font.loadAsync({
      Roboto: require("native-base/Fonts/Roboto.ttf"),
      Roboto_medium: require("native-base/Fonts/Roboto_medium.ttf"),
      Ionicons: require("native-base/Fonts/Ionicons.ttf")
    });
    this.setState({ isReady: true });
  }
  render() {
    if (!this.state.isReady) {
      return <AppLoading />;
    }
    return (
      <Container>
        <RootNavigator />
      </Container>
    );
  }
}

export default withAuthenticator(App);