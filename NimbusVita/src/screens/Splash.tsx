import React from 'react';
import LottieView from 'lottie-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useNavigation } from '@react-navigation/native';
import { View, StyleSheet, Dimensions } from 'react-native';

export function Splash() {
    const navigation = useNavigation();
    
    return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <LottieView
                source={require("../assets/Splash.json")}
                style={{width: "100%", height: "100%"}}
                autoPlay
                loop={false}
                speed={1.0}
                onAnimationFinish={() => navigation.navigate('Login')}
            />
        </View>
    );
}

const styles = StyleSheet.create({
});