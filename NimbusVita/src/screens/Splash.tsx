import React from 'react';
import LottieView from 'lottie-react-native';
import { View, StyleSheet } from 'react-native';

export function Splash() {
    return (
       <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#5559ff'}}>
            <LottieView
                source={require("../assets/Splash.json")}
                style={{width: "100%", height: "100%"}}
                autoPlay
                loop={true}
                speed={1.0}
            />
        </View>
    );
}

const styles = StyleSheet.create({
});