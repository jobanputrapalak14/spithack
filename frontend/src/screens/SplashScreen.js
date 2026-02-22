import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';

const { width, height } = Dimensions.get('window');

// Motivational quotes pool — a random one is picked each launch
const MOTIVATIONAL_QUOTES = [
  { emoji: '🏆', text: 'Champions show up daily' },
  { emoji: '🔥', text: 'Stay hungry, stay focused' },
  { emoji: '💪', text: 'Discipline beats motivation' },
  { emoji: '🚀', text: 'Launch your best self today' },
  { emoji: '⚡', text: 'Small steps, big results' },
  { emoji: '🌟', text: 'Your potential is limitless' },
  { emoji: '🎯', text: 'Focus on what matters most' },
  { emoji: '💎', text: 'Consistency creates excellence' },
  { emoji: '🌅', text: 'Every day is a fresh start' },
  { emoji: '🧠', text: 'Think big, act now' },
  { emoji: '✨', text: 'Progress over perfection' },
  { emoji: '🦁', text: 'Be bold, be fearless' },
  { emoji: '🏔️', text: 'One step closer to the top' },
  { emoji: '💡', text: 'Ideas mean nothing without action' },
  { emoji: '🎖️', text: 'Earn your success every day' },
  { emoji: '🌊', text: 'Ride the wave of momentum' },
  { emoji: '⏳', text: 'Make every second count' },
  { emoji: '🔑', text: 'Unlock your true potential' },
  { emoji: '🙌', text: 'You are capable of greatness' },
  { emoji: '🛤️', text: 'The journey is the reward' },
];

// Floating particle component
function FloatingParticle({ delay, startX, startY, size, duration }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -60,
            duration: duration,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX,
          top: startY,
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    />
  );
}

// Animated bouncing dot
function BouncingDot({ delay, color }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -8,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1.2,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          backgroundColor: color,
          transform: [{ translateY }, { scale }],
        },
      ]}
    />
  );
}

export default function SplashScreen({ navigation }) {
  const { isAuthenticated, isLoading } = useApp();

  // Pick a random quote (memoized so it stays the same for the session)
  const quote = useMemo(() => {
    const idx = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    return MOTIVATIONAL_QUOTES[idx];
  }, []);

  // Animation values
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(30)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(20)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;
  const quoteOpacity = useRef(new Animated.Value(0)).current;
  const quoteTranslateY = useRef(new Animated.Value(20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Floating particles data
  const particles = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      startX: Math.random() * (width - 10),
      startY: Math.random() * (height * 0.6) + height * 0.1,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 3000,
      duration: Math.random() * 2000 + 2000,
    }));
  }, []);

  useEffect(() => {
    // --- Staggered entrance sequence ---
    Animated.sequence([
      // 1. Logo pops in with a spring bounce + slight rotation
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),

      // 2. Title slides up & fades in
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(titleTranslateY, {
          toValue: 0,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),

      // 3. Subtitle slides up & fades in
      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(subtitleTranslateY, {
          toValue: 0,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),

      // 4. Dots appear
      Animated.timing(dotsOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),

      // 5. Motivational quote fades in
      Animated.parallel([
        Animated.timing(quoteOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(quoteTranslateY, {
          toValue: 0,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Continuous subtle pulse on logo glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Navigation after splash
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          navigation.replace('Main');
        } else {
          navigation.replace('Login');
        }
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, navigation]);

  const spin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15deg', '0deg'],
  });

  return (
    <LinearGradient
      colors={['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Floating particles */}
      {particles.map((p) => (
        <FloatingParticle
          key={p.id}
          delay={p.delay}
          startX={p.startX}
          startY={p.startY}
          size={p.size}
          duration={p.duration}
        />
      ))}

      <View style={styles.content}>
        {/* Logo with glow */}
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              transform: [{ scale: Animated.multiply(logoScale, pulseAnim) }],
            },
          ]}
        >
          {/* Outer glow ring */}
          <Animated.View
            style={[
              styles.glowRing,
              { opacity: glowOpacity },
            ]}
          />
          {/* Inner frosted circle */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{ rotate: spin }],
              },
            ]}
          >
            <Icon name="zap" size={55} color="#fff" />
          </Animated.View>
        </Animated.View>

        {/* App name — split style */}
        <Animated.View
          style={[
            styles.titleRow,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          <Text style={styles.titleFocus}>Focus</Text>
          <Text style={styles.titleFlow}>Flow</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.Text
          style={[
            styles.subtitle,
            {
              opacity: subtitleOpacity,
              transform: [{ translateY: subtitleTranslateY }],
            },
          ]}
        >
          Your Smart Productivity Companion
        </Animated.Text>

        {/* Loading dots */}
        <Animated.View style={[styles.dotsRow, { opacity: dotsOpacity }]}>
          <BouncingDot delay={0} color="rgba(255,255,255,0.7)" />
          <BouncingDot delay={150} color="rgba(255,255,255,0.9)" />
          <BouncingDot delay={300} color="rgba(255,255,255,0.7)" />
        </Animated.View>

        {/* Motivational quote */}
        <Animated.View
          style={[
            styles.quoteContainer,
            {
              opacity: quoteOpacity,
              transform: [{ translateY: quoteTranslateY }],
            },
          ]}
        >
          <Text style={styles.quoteText}>
            {quote.emoji} {quote.text}
          </Text>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  // Floating particles
  particle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  // Logo wrapper
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 35,
    width: 190,
    height: 190,
  },
  // Outer glow
  glowRing: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  // Frosted icon container
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    // Shadow for depth & glow
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 15,
  },
  logoImage: {
    width: 95,
    height: 95,
    borderRadius: 48,
  },
  // Title row
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleFocus: {
    fontSize: 48,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(255, 255, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  titleFlow: {
    fontSize: 48,
    fontWeight: '300',
    color: '#FFD700',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  // Subtitle / tagline
  subtitle: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  // Loading dots row
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  // Motivational quote
  quoteContainer: {
    marginTop: 30,
  },
  quoteText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
