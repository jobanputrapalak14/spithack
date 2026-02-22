import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

/**
 * Wraps a screen's content with a staggered fade-in + slide-up entrance animation.
 * Drop this around the content inside any screen to get smooth appear-on-load effects.
 * 
 * Props:
 *  - delay (ms): how long to wait before animation starts (default: 0)
 *  - duration (ms): animation duration (default: 500)
 *  - slideDistance: how far up the content slides (default: 30)
 *  - style: additional styles
 */
export function AnimatedEntry({ children, delay = 0, duration = 500, slideDistance = 30, style }) {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(slideDistance)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration,
                delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                { opacity, transform: [{ translateY }] },
                style,
            ]}
        >
            {children}
        </Animated.View>
    );
}

/**
 * Wraps a screen's content with a staggered animation where each direct child
 * fades in and slides up with increasing delay.
 *
 * Props:
 *  - staggerDelay (ms): delay between each child (default: 80)
 *  - initialDelay (ms): delay before first child animates (default: 100)
 *  - duration (ms): animation duration per child (default: 450)
 *  - style: additional styles for the wrapper
 */
export function StaggeredList({ children, staggerDelay = 80, initialDelay = 100, duration = 450, style }) {
    const childArray = React.Children.toArray(children);

    return (
        <>
            {childArray.map((child, index) => (
                <AnimatedEntry
                    key={index}
                    delay={initialDelay + index * staggerDelay}
                    duration={duration}
                    style={style}
                >
                    {child}
                </AnimatedEntry>
            ))}
        </>
    );
}

/**
 * A scale-in animation for cards/sections.
 * Content starts slightly smaller and scales up to full size.
 */
export function ScaleIn({ children, delay = 0, duration = 400, style }) {
    const scale = useRef(new Animated.Value(0.92)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scale, {
                toValue: 1,
                tension: 60,
                friction: 8,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration,
                delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                { opacity, transform: [{ scale }] },
                style,
            ]}
        >
            {children}
        </Animated.View>
    );
}
