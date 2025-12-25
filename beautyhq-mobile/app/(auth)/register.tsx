import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
import { useAuthStore } from '../../src/contexts/auth-store';
import { isValidEmail } from '../../src/utils/helpers';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { register, isLoading } = useAuthStore();

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone || undefined,
      businessName: formData.businessName || undefined,
    });

    if (result.success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Registration Failed', result.error || 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start managing your salon today</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Full Name"
              placeholder="Your name"
              value={formData.name}
              onChangeText={(v) => updateField('name', v)}
              autoCapitalize="words"
              error={errors.name}
              leftIcon={
                <Ionicons name="person-outline" size={20} color={colors.gray[400]} />
              }
            />

            <Input
              label="Email"
              placeholder="you@example.com"
              value={formData.email}
              onChangeText={(v) => updateField('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
              leftIcon={
                <Ionicons name="mail-outline" size={20} color={colors.gray[400]} />
              }
            />

            <Input
              label="Phone (Optional)"
              placeholder="(555) 123-4567"
              value={formData.phone}
              onChangeText={(v) => updateField('phone', v)}
              keyboardType="phone-pad"
              error={errors.phone}
              leftIcon={
                <Ionicons name="call-outline" size={20} color={colors.gray[400]} />
              }
            />

            <Input
              label="Business Name (Optional)"
              placeholder="Your salon name"
              value={formData.businessName}
              onChangeText={(v) => updateField('businessName', v)}
              error={errors.businessName}
              leftIcon={
                <Ionicons name="business-outline" size={20} color={colors.gray[400]} />
              }
            />

            <Input
              label="Password"
              placeholder="Create a password"
              value={formData.password}
              onChangeText={(v) => updateField('password', v)}
              isPassword
              error={errors.password}
              helperText="Must be at least 8 characters"
              leftIcon={
                <Ionicons name="lock-closed-outline" size={20} color={colors.gray[400]} />
              }
            />

            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChangeText={(v) => updateField('confirmPassword', v)}
              isPassword
              error={errors.confirmPassword}
              leftIcon={
                <Ionicons name="lock-closed-outline" size={20} color={colors.gray[400]} />
              }
            />

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={isLoading}
              fullWidth
              size="large"
              style={styles.submitButton}
            />

            <Text style={styles.termsText}>
              By creating an account, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
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
  },
  form: {
    flex: 1,
  },
  submitButton: {
    marginTop: 8,
  },
  termsText: {
    fontSize: 13,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
  termsLink: {
    color: colors.primary[600],
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  footerLink: {
    fontSize: 14,
    color: colors.primary[600],
    fontWeight: '600',
  },
});
