import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  Alert, 
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ route }) => {
  const { onLogin } = route.params;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isFocused, setIsFocused] = useState({ username: false, password: false });
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const moveAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const buttonAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(moveAnim, {
        toValue: 0,
        duration: 1000,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleFocus = (field) => {
    setIsFocused({...isFocused, [field]: true});
  };

  const handleBlur = (field) => {
    setIsFocused({...isFocused, [field]: false});
  };
  
  const handleButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => handleLogin());
  };
  
  const handleLogin = () => {
    // Simple authentication with sample user/password
    if (username === 'user' && password === 'password') {
      onLogin();
    } else {
      Alert.alert('Login Failed', 'Invalid username or password');
    }
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#4c669f', '#3b5998', '#192f6a']} 
        style={styles.background}
      />
      
      <Animated.View style={[
        styles.loginBox,
        { 
          opacity: fadeAnim,
          transform: [
            { translateY: moveAnim },
            { scale: scaleAnim }
          ]
        }
      ]}>
        <Animated.Image 
          source={require('../assets/icon.png')} 
          style={[styles.logo, { transform: [{ scale: scaleAnim }] }]}
          resizeMode="contain"
        />
        <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>
          Smart File Manager
        </Animated.Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Username</Text>
          <Animated.View style={[
            styles.inputWrapper,
            isFocused.username && styles.inputFocused
          ]}>
            <TextInput
              style={styles.input}
              placeholder="Enter username"
              placeholderTextColor="#a0a0a0"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              onFocus={() => handleFocus('username')}
              onBlur={() => handleBlur('username')}
            />
          </Animated.View>
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <Animated.View style={[
            styles.inputWrapper,
            isFocused.password && styles.inputFocused
          ]}>
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              placeholderTextColor="#a0a0a0"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              onFocus={() => handleFocus('password')}
              onBlur={() => handleBlur('password')}
            />
          </Animated.View>
        </View>
        
        <Animated.View style={{ 
          width: '100%',
          transform: [{ scale: buttonAnim }]
        }}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.loginButton} 
            onPress={handleButtonPress}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </Animated.View>
        
        <Animated.Text style={[styles.hint, { opacity: fadeAnim }]}>
          Hint: username: "user", password: "password"
        </Animated.Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  loginBox: {
    width: '100%',
    maxWidth: 350,
    padding: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.35,
    shadowRadius: 13.5,
    elevation: 15,
    backdropFilter: 'blur(10px)',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2a2a72',
    marginBottom: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a4a4a',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#d0d0d0',
    borderRadius: 12,
    backgroundColor: 'rgba(250, 250, 250, 0.8)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputFocused: {
    borderColor: '#4c669f',
    borderWidth: 2,
    backgroundColor: '#fff',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  input: {
    width: '100%',
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
  },
  loginButton: {
    width: '100%',
    height: 55,
    backgroundColor: '#4c669f',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#4c669f',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  hint: {
    marginTop: 25,
    color: '#888',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default LoginScreen;