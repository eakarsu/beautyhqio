import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:beautyhq_flutter/app/theme.dart';
import 'package:beautyhq_flutter/features/auth/providers/auth_provider.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Profile section
            Container(
              padding: const EdgeInsets.all(16),
              color: Theme.of(context).cardColor,
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 32,
                    backgroundColor: AppColors.primary,
                    child: Text(
                      authState.user?.initials ?? 'U',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          authState.user?.fullName ?? 'User',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        Text(
                          authState.user?.email ?? '',
                          style: TextStyle(
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.edit),
                    onPressed: () {
                      // TODO: Navigate to edit profile
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Account settings
            _buildSectionHeader(context, 'Account'),
            _buildSettingsTile(
              context,
              icon: Icons.person_outline,
              title: 'Profile',
              subtitle: 'Manage your personal information',
              onTap: () {
                // TODO: Navigate to profile
              },
            ),
            _buildSettingsTile(
              context,
              icon: Icons.lock_outline,
              title: 'Password',
              subtitle: 'Change your password',
              onTap: () {
                // TODO: Navigate to change password
              },
            ),
            _buildSettingsTile(
              context,
              icon: Icons.notifications_outlined,
              title: 'Notifications',
              subtitle: 'Manage notification preferences',
              onTap: () {
                // TODO: Navigate to notifications
              },
            ),
            const SizedBox(height: 16),

            // Business settings
            _buildSectionHeader(context, 'Business'),
            _buildSettingsTile(
              context,
              icon: Icons.business_outlined,
              title: 'Business Profile',
              subtitle: 'Manage your business information',
              onTap: () {
                // TODO: Navigate to business profile
              },
            ),
            _buildSettingsTile(
              context,
              icon: Icons.access_time,
              title: 'Business Hours',
              subtitle: 'Set your operating hours',
              onTap: () {
                // TODO: Navigate to business hours
              },
            ),
            _buildSettingsTile(
              context,
              icon: Icons.spa_outlined,
              title: 'Services',
              subtitle: 'Manage your services and pricing',
              onTap: () {
                // TODO: Navigate to services
              },
            ),
            _buildSettingsTile(
              context,
              icon: Icons.people_outline,
              title: 'Staff',
              subtitle: 'Manage your team members',
              onTap: () {
                // TODO: Navigate to staff
              },
            ),
            const SizedBox(height: 16),

            // App settings
            _buildSectionHeader(context, 'App'),
            _buildSettingsTile(
              context,
              icon: Icons.palette_outlined,
              title: 'Appearance',
              subtitle: 'Theme and display settings',
              onTap: () {
                // TODO: Navigate to appearance
              },
            ),
            _buildSettingsTile(
              context,
              icon: Icons.language,
              title: 'Language',
              subtitle: 'English',
              onTap: () {
                // TODO: Navigate to language
              },
            ),
            _buildSettingsTile(
              context,
              icon: Icons.help_outline,
              title: 'Help & Support',
              subtitle: 'Get help and contact us',
              onTap: () {
                // TODO: Navigate to help
              },
            ),
            _buildSettingsTile(
              context,
              icon: Icons.info_outline,
              title: 'About',
              subtitle: 'Version 1.0.0',
              onTap: () {
                // TODO: Show about dialog
              },
            ),
            const SizedBox(height: 16),

            // Logout
            Padding(
              padding: const EdgeInsets.all(16),
              child: SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () async {
                    final confirm = await showDialog<bool>(
                      context: context,
                      builder: (context) => AlertDialog(
                        title: const Text('Sign Out'),
                        content:
                            const Text('Are you sure you want to sign out?'),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(context, false),
                            child: const Text('Cancel'),
                          ),
                          TextButton(
                            onPressed: () => Navigator.pop(context, true),
                            child: const Text('Sign Out'),
                          ),
                        ],
                      ),
                    );

                    if (confirm == true && context.mounted) {
                      await ref.read(authStateProvider.notifier).logout();
                      if (context.mounted) {
                        context.go('/login');
                      }
                    }
                  },
                  icon: const Icon(Icons.logout, color: AppColors.error),
                  label: const Text(
                    'Sign Out',
                    style: TextStyle(color: AppColors.error),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppColors.error),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Text(
        title,
        style: TextStyle(
          color: Colors.grey[600],
          fontWeight: FontWeight.w600,
          fontSize: 12,
        ),
      ),
    );
  }

  Widget _buildSettingsTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      onTap: onTap,
      leading: Icon(icon, color: AppColors.primary),
      title: Text(title),
      subtitle: Text(
        subtitle,
        style: TextStyle(
          color: Colors.grey[600],
          fontSize: 12,
        ),
      ),
      trailing: const Icon(Icons.chevron_right),
    );
  }
}
