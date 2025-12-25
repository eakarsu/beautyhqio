import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input } from '../../src/components/ui';
import { colors } from '../../src/utils/colors';
import { authService } from '../../src/services';
import { isValidEmail } from '../../src/utils/helpers';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      setError('Email is required');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authService.forgotPassword(email);

      if (response.error) {
        setError(response.error);
      } else {
        setIsSuccess(true);
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="mail-outline" size={48} color={colors.primary[600]} />
          </View>
          <Text style={styles.successTitle}>Check Your Email</Text>
          <Text style={styles.successMessage}>
            We've sent password reset instructions to{'\n'}
            <Text style={styles.emailText}>{email}</Text>
          </Text>
          <Button
            title="Back to Sign In"
            onPress={() => router.back()}
            fullWidth
            size="large"
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButtonIcon}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email and we'll send you instructions to reset your password.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={error}
              leftIcon={
                <Ionicons name="mail-outline" size={20} color={colors.gray[400]} />
              }
            />

            <Button
              title="Send Reset Link"
              onPress={handleSubmit}
              loading={isLoading}
              fullWidth
              size="large"
            />
          </View>

          {/* Footer */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.footer}
          >
            <Ionicons name="arrow-back" size={16} color={colors.primary[600]} />
            <Text style={styles.footerText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    marginBottom: 32,
  },
  backButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  form: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 14,
    color: colors.primary[600],
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emailText: {
    fontWeight: '600',
    color: colors.text.primary,
  },
  backButton: {
    marginTop: 16,
  },
});
