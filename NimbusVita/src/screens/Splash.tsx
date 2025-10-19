import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { Colors, Typography, Spacing } from '../styles';

export const Splash = () => {
    return (
        <View style={styles.container}>
            <LottieView
                autoPlay
                loop
                style={styles.lottie}
                source={require('../assets/Splash.json')}
            />
            <Text style={styles.loadingText}>Carregando...</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.primary,
    },
    lottie: {
        width: 300,
        height: 300,
    },
    loadingText: {
        ...Typography.body,
        color: Colors.textWhite,
        marginTop: Spacing.lg,
    },
});