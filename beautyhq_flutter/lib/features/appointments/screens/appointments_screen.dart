import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:beautyhq_flutter/app/theme.dart';
import 'package:beautyhq_flutter/features/appointments/providers/appointments_provider.dart';
import 'package:beautyhq_flutter/features/dashboard/widgets/appointment_card.dart';

class AppointmentsScreen extends ConsumerWidget {
  const AppointmentsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appointmentsState = ref.watch(appointmentsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Appointments'),
        actions: [
          IconButton(
            icon: const Icon(Icons.today),
            onPressed: () {
              ref.read(appointmentsProvider.notifier).goToToday();
            },
          ),
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () {
              // TODO: Show filter options
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Date navigation
          Container(
            padding: const EdgeInsets.symmetric(vertical: 16),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  offset: const Offset(0, 2),
                  blurRadius: 4,
                ),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(
                  icon: const Icon(Icons.chevron_left),
                  onPressed: () {
                    ref.read(appointmentsProvider.notifier).goToPreviousDay();
                  },
                ),
                GestureDetector(
                  onTap: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: appointmentsState.selectedDate,
                      firstDate: DateTime(2020),
                      lastDate: DateTime(2030),
                    );
                    if (date != null) {
                      ref.read(appointmentsProvider.notifier).changeDate(date);
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        Text(
                          _isToday(appointmentsState.selectedDate)
                              ? 'Today'
                              : DateFormat('EEEE')
                                  .format(appointmentsState.selectedDate),
                          style: TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          DateFormat('MMM d, yyyy')
                              .format(appointmentsState.selectedDate),
                          style: TextStyle(
                            color: AppColors.primary,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.chevron_right),
                  onPressed: () {
                    ref.read(appointmentsProvider.notifier).goToNextDay();
                  },
                ),
              ],
            ),
          ),

          // Appointments list
          Expanded(
            child: appointmentsState.isLoading
                ? const Center(child: CircularProgressIndicator())
                : appointmentsState.appointments.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.calendar_today_outlined,
                              size: 64,
                              color: Colors.grey[400],
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'No appointments',
                              style: TextStyle(
                                fontSize: 18,
                                color: Colors.grey[600],
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'No appointments scheduled for this day',
                              style: TextStyle(
                                color: Colors.grey[500],
                              ),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: () =>
                            ref.read(appointmentsProvider.notifier).loadAppointments(),
                        child: ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: appointmentsState.appointments.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final appointment =
                                appointmentsState.appointments[index];
                            return AppointmentCard(
                              appointment: appointment,
                              onTap: () =>
                                  context.go('/appointments/${appointment.id}'),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          // TODO: Navigate to new appointment
        },
        icon: const Icon(Icons.add),
        label: const Text('New Appointment'),
      ),
    );
  }

  bool _isToday(DateTime date) {
    final now = DateTime.now();
    return date.year == now.year &&
        date.month == now.month &&
        date.day == now.day;
  }
}
