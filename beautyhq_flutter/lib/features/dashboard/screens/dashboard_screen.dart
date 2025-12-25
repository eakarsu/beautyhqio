import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:beautyhq_flutter/app/theme.dart';
import 'package:beautyhq_flutter/features/dashboard/providers/dashboard_provider.dart';
import 'package:beautyhq_flutter/features/dashboard/widgets/stat_card.dart';
import 'package:beautyhq_flutter/features/dashboard/widgets/quick_action_card.dart';
import 'package:beautyhq_flutter/features/dashboard/widgets/appointment_card.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboardState = ref.watch(dashboardProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {
              // TODO: Show notifications
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(dashboardProvider.notifier).refresh(),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Greeting
              Text(
                'Welcome back!',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              Text(
                DateFormat('EEEE, MMMM d, yyyy').format(DateTime.now()),
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
              const SizedBox(height: 24),

              // Stats Grid
              if (dashboardState.isLoading)
                const Center(child: CircularProgressIndicator())
              else if (dashboardState.stats != null) ...[
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1.5,
                  children: [
                    StatCard(
                      title: "Today's Appointments",
                      value: '${dashboardState.stats!.todayAppointments}',
                      icon: Icons.calendar_today,
                      color: AppColors.primary,
                    ),
                    StatCard(
                      title: "Today's Revenue",
                      value: '\$${dashboardState.stats!.todayRevenue.toStringAsFixed(0)}',
                      icon: Icons.attach_money,
                      color: AppColors.success,
                    ),
                    StatCard(
                      title: 'Total Clients',
                      value: '${dashboardState.stats!.totalClients}',
                      icon: Icons.people,
                      color: AppColors.secondary,
                    ),
                    StatCard(
                      title: 'This Week',
                      value: '\$${dashboardState.stats!.weekRevenue.toStringAsFixed(0)}',
                      icon: Icons.trending_up,
                      color: AppColors.info,
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 24),

              // Quick Actions
              Text(
                'Quick Actions',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    QuickActionCard(
                      title: 'New Appointment',
                      icon: Icons.add_circle_outline,
                      color: AppColors.primary,
                      onTap: () {
                        // TODO: Navigate to new appointment
                      },
                    ),
                    const SizedBox(width: 12),
                    QuickActionCard(
                      title: 'Add Client',
                      icon: Icons.person_add_outlined,
                      color: AppColors.secondary,
                      onTap: () {
                        // TODO: Navigate to add client
                      },
                    ),
                    const SizedBox(width: 12),
                    QuickActionCard(
                      title: 'Quick Sale',
                      icon: Icons.point_of_sale,
                      color: AppColors.success,
                      onTap: () => context.go('/pos'),
                    ),
                    const SizedBox(width: 12),
                    QuickActionCard(
                      title: 'View Reports',
                      icon: Icons.bar_chart,
                      color: AppColors.info,
                      onTap: () {
                        // TODO: Navigate to reports
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Upcoming Appointments
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Upcoming Appointments',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  TextButton(
                    onPressed: () => context.go('/appointments'),
                    child: const Text('View All'),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              if (dashboardState.upcomingAppointments.isEmpty)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Center(
                      child: Column(
                        children: [
                          Icon(
                            Icons.calendar_today_outlined,
                            size: 48,
                            color: Colors.grey[400],
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'No upcoming appointments',
                            style: TextStyle(color: Colors.grey[600]),
                          ),
                        ],
                      ),
                    ),
                  ),
                )
              else
                ...dashboardState.upcomingAppointments.map(
                  (appointment) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: AppointmentCard(
                      appointment: appointment,
                      onTap: () =>
                          context.go('/appointments/${appointment.id}'),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
