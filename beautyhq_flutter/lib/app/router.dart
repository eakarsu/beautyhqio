import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:beautyhq_flutter/features/auth/providers/auth_provider.dart';
import 'package:beautyhq_flutter/features/auth/screens/login_screen.dart';
import 'package:beautyhq_flutter/features/auth/screens/register_screen.dart';
import 'package:beautyhq_flutter/features/auth/screens/forgot_password_screen.dart';
import 'package:beautyhq_flutter/features/home/screens/home_screen.dart';
import 'package:beautyhq_flutter/features/dashboard/screens/dashboard_screen.dart';
import 'package:beautyhq_flutter/features/appointments/screens/appointments_screen.dart';
import 'package:beautyhq_flutter/features/appointments/screens/appointment_detail_screen.dart';
import 'package:beautyhq_flutter/features/clients/screens/clients_screen.dart';
import 'package:beautyhq_flutter/features/clients/screens/client_detail_screen.dart';
import 'package:beautyhq_flutter/features/pos/screens/pos_screen.dart';
import 'package:beautyhq_flutter/features/settings/screens/settings_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      final isAuthenticated = authState.isAuthenticated;
      final isAuthRoute = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register' ||
          state.matchedLocation == '/forgot-password';

      if (!isAuthenticated && !isAuthRoute) {
        return '/login';
      }

      if (isAuthenticated && isAuthRoute) {
        return '/';
      }

      return null;
    },
    routes: [
      // Auth routes
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        name: 'register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/forgot-password',
        name: 'forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),

      // Main app shell
      ShellRoute(
        builder: (context, state, child) => HomeScreen(child: child),
        routes: [
          GoRoute(
            path: '/',
            name: 'dashboard',
            builder: (context, state) => const DashboardScreen(),
          ),
          GoRoute(
            path: '/appointments',
            name: 'appointments',
            builder: (context, state) => const AppointmentsScreen(),
            routes: [
              GoRoute(
                path: ':id',
                name: 'appointment-detail',
                builder: (context, state) {
                  final id = state.pathParameters['id']!;
                  return AppointmentDetailScreen(appointmentId: id);
                },
              ),
            ],
          ),
          GoRoute(
            path: '/clients',
            name: 'clients',
            builder: (context, state) => const ClientsScreen(),
            routes: [
              GoRoute(
                path: ':id',
                name: 'client-detail',
                builder: (context, state) {
                  final id = state.pathParameters['id']!;
                  return ClientDetailScreen(clientId: id);
                },
              ),
            ],
          ),
          GoRoute(
            path: '/pos',
            name: 'pos',
            builder: (context, state) => const POSScreen(),
          ),
          GoRoute(
            path: '/settings',
            name: 'settings',
            builder: (context, state) => const SettingsScreen(),
          ),
        ],
      ),
    ],
  );
});
