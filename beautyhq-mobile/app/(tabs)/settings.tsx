import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Avatar } from '../../src/components/ui';
import { colors } from '../../src/utils/colors';
import { useAuthStore } from '../../src/contexts/auth-store';

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  danger?: boolean;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  iconColor = colors.primary[600],
  iconBg = colors.primary[50],
  title,
  subtitle,
  onPress,
  showArrow = true,
  danger = false,
}) => (
  <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
    <View style={[styles.settingsIcon, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={20} color={iconColor} />
    </View>
    <View style={styles.settingsContent}>
      <Text style={[styles.settingsTitle, danger && styles.dangerText]}>{title}</Text>
      {subtitle && <Text style={styles.settingsSubtitle}>{subtitle}</Text>}
    </View>
    {showArrow && (
      <Ionicons name="chevron-forward" size={18} color={colors.gray[400]} />
    )}
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <Card variant="elevated" style={styles.profileCard}>
          <Avatar
            source={user?.image}
            firstName={user?.name?.split(' ')[0] || 'U'}
            lastName={user?.name?.split(' ')[1]}
            size="xlarge"
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role || 'OWNER'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editProfileBtn}>
            <Ionicons name="create-outline" size={20} color={colors.primary[600]} />
          </TouchableOpacity>
        </Card>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Card variant="outlined" padding="none">
            <SettingsItem
              icon="person-outline"
              title="Edit Profile"
              subtitle="Update your personal information"
            />
            <View style={styles.divider} />
            <SettingsItem
              icon="lock-closed-outline"
              title="Change Password"
              subtitle="Update your security credentials"
            />
            <View style={styles.divider} />
            <SettingsItem
              icon="notifications-outline"
              title="Notifications"
              subtitle="Manage push and email notifications"
            />
          </Card>
        </View>

        {/* Business Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business</Text>
          <Card variant="outlined" padding="none">
            <SettingsItem
              icon="business-outline"
              iconColor={colors.secondary[600]}
              iconBg={colors.secondary[50]}
              title="Salon Profile"
              subtitle="Edit business information"
            />
            <View style={styles.divider} />
            <SettingsItem
              icon="people-outline"
              iconColor={colors.secondary[600]}
              iconBg={colors.secondary[50]}
              title="Staff"
              subtitle="Manage team members"
            />
            <View style={styles.divider} />
            <SettingsItem
              icon="cut-outline"
              iconColor={colors.secondary[600]}
              iconBg={colors.secondary[50]}
              title="Services"
              subtitle="Edit service menu and pricing"
            />
            <View style={styles.divider} />
            <SettingsItem
              icon="time-outline"
              iconColor={colors.secondary[600]}
              iconBg={colors.secondary[50]}
              title="Business Hours"
              subtitle="Set operating hours"
            />
          </Card>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <Card variant="outlined" padding="none">
            <SettingsItem
              icon="color-palette-outline"
              iconColor={colors.info.dark}
              iconBg={colors.info.light}
              title="Appearance"
              subtitle="Dark mode, colors"
            />
            <View style={styles.divider} />
            <SettingsItem
              icon="language-outline"
              iconColor={colors.info.dark}
              iconBg={colors.info.light}
              title="Language"
              subtitle="English (US)"
            />
            <View style={styles.divider} />
            <SettingsItem
              icon="globe-outline"
              iconColor={colors.info.dark}
              iconBg={colors.info.light}
              title="Timezone"
              subtitle="America/New_York"
            />
          </Card>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <Card variant="outlined" padding="none">
            <SettingsItem
              icon="help-circle-outline"
              iconColor={colors.warning.dark}
              iconBg={colors.warning.light}
              title="Help Center"
            />
            <View style={styles.divider} />
            <SettingsItem
              icon="chatbubble-outline"
              iconColor={colors.warning.dark}
              iconBg={colors.warning.light}
              title="Contact Support"
            />
            <View style={styles.divider} />
            <SettingsItem
              icon="document-text-outline"
              iconColor={colors.warning.dark}
              iconBg={colors.warning.light}
              title="Terms of Service"
            />
            <View style={styles.divider} />
            <SettingsItem
              icon="shield-checkmark-outline"
              iconColor={colors.warning.dark}
              iconBg={colors.warning.light}
              title="Privacy Policy"
            />
          </Card>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <Card variant="outlined" padding="none">
            <SettingsItem
              icon="log-out-outline"
              iconColor={colors.error.main}
              iconBg={colors.error.light}
              title="Sign Out"
              showArrow={false}
              danger
              onPress={handleLogout}
            />
          </Card>
        </View>

        {/* Version */}
        <Text style={styles.versionText}>BeautyHQ v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginTop: 16,
    gap: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.primary[100],
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[700],
  },
  editProfileBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
  },
  settingsSubtitle: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  dangerText: {
    color: colors.error.main,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[100],
    marginLeft: 70,
  },
  versionText: {
    fontSize: 13,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: 32,
  },
});
