import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import LottieView from 'lottie-react-native';
import { Colors } from '../styles';

export const Splash = () => {
    // Animações para os 3 pontos
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Função para animar um ponto com efeito mais suave
        const animateDot = (animatedValue: Animated.Value, delay: number) => {
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(animatedValue, {
                        toValue: 1,
                        duration: 800,
                        easing: Easing.bezier(0.4, 0.0, 0.2, 1), // Curva suave material design
                        useNativeDriver: true,
                    }),
                    Animated.timing(animatedValue, {
                        toValue: 0,
                        duration: 800,
                        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        // Iniciar animações com delays diferentes para efeito cascata elegante
        animateDot(dot1, 0);
        animateDot(dot2, 150);
        animateDot(dot3, 300);
    }, [dot1, dot2, dot3]);

    // Interpolar os valores para escala e opacidade
    const createDotStyle = (animatedValue: Animated.Value) => ({
        transform: [
            {
                scale: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.2],
                }),
            },
        ],
        opacity: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.4, 1],
        }),
    });

    return (
        <View style={styles.container}>
            <LottieView
                autoPlay
                loop
                style={styles.lottie}
                source={require('../assets/Splash.json')}
            />
            
            {/* Indicador de carregamento minimalista com 3 pontos */}
            <View style={styles.loadingContainer}>
                <Animated.View style={[styles.dot, createDotStyle(dot1)]} />
                <Animated.View style={[styles.dot, createDotStyle(dot2)]} />
                <Animated.View style={[styles.dot, createDotStyle(dot3)]} />
            </View>
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
        width: 600,
        height: 600,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 30,
        gap: 10,
        paddingHorizontal: 20,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.secondary,
        shadowColor: Colors.secondary,
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0.6,
        shadowRadius: 4,
        elevation: 4,
    },
});