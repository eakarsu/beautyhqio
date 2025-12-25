import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:beautyhq_flutter/app/theme.dart';
import 'package:beautyhq_flutter/core/models/appointment.dart';
import 'package:beautyhq_flutter/core/services/appointment_service.dart';
import 'package:beautyhq_flutter/features/appointments/providers/appointments_provider.dart';

final appointmentDetailProvider =
    FutureProvider.family<Appointment?, String>((ref, id) async {
  final service = ref.watch(appointmentServiceProvider);
  return service.getAppointment(id);
});

class AppointmentDetailScreen extends ConsumerWidget {
  final String appointmentId;

  const AppointmentDetailScreen({
    super.key,
    required this.appointmentId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appointmentAsync = ref.watch(appointmentDetailProvider(appointmentId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Appointment Details'),
        actions: [
          PopupMenuButton<String>(
            onSelected: (value) async {
              switch (value) {
                case 'edit':
                  // TODO: Navigate to edit
                  break;
                case 'cancel':
                  _showCancelDialog(context, ref);
                  break;
                case 'delete':
                  _showDeleteDialog(context, ref);
                  break;
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'edit',
                child: Row(
                  children: [
                    Icon(Icons.edit),
                    SizedBox(width: 8),
                    Text('Edit'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'cancel',
                child: Row(
                  children: [
                    Icon(Icons.cancel, color: AppColors.warning),
                    SizedBox(width: 8),
                    Text('Cancel Appointment'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'delete',
                child: Row(
                  children: [
                    Icon(Icons.delete, color: AppColors.error),
                    SizedBox(width: 8),
                    Text('Delete'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: appointmentAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Error: $error')),
        data: (appointment) {
          if (appointment == null) {
            return const Center(child: Text('Appointment not found'));
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Status card
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: appointment.status.backgroundColor,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            appointment.status.icon,
                            color: appointment.status.color,
                            size: 32,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                appointment.status.displayName,
                                style: Theme.of(context)
                                    .textTheme
                                    .titleLarge
                                    ?.copyWith(
                                      color: appointment.status.color,
                                      fontWeight: FontWeight.bold,
                                    ),
                              ),
                              Text(
                                DateFormat('EEEE, MMMM d, yyyy')
                                    .format(appointment.startTime),
                                style: TextStyle(color: Colors.grey[600]),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Time and Duration
                _buildSection(
                  context,
                  title: 'Time',
                  child: Row(
                    children: [
                      Expanded(
                        child: _buildInfoItem(
                          context,
                          icon: Icons.access_time,
                          label: 'Start',
                          value: DateFormat('h:mm a')
                              .format(appointment.startTime),
                        ),
                      ),
                      Expanded(
                        child: _buildInfoItem(
                          context,
                          icon: Icons.access_time_filled,
                          label: 'End',
                          value:
                              DateFormat('h:mm a').format(appointment.endTime),
                        ),
                      ),
                      Expanded(
                        child: _buildInfoItem(
                          context,
                          icon: Icons.timelapse,
                          label: 'Duration',
                          value: '${appointment.totalDuration} min',
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Client
                _buildSection(
                  context,
                  title: 'Client',
                  child: ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: CircleAvatar(
                      backgroundColor: appointment.client?.avatarColor ??
                          AppColors.primary,
                      child: Text(
                        appointment.client?.initials ?? 'C',
                        style: const TextStyle(color: Colors.white),
                      ),
                    ),
                    title: Text(
                        appointment.client?.fullName ?? 'Unknown Client'),
                    subtitle: appointment.client?.phone != null
                        ? Text(appointment.client!.phone!)
                        : null,
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (appointment.client?.phone != null)
                          IconButton(
                            icon: const Icon(Icons.phone),
                            onPressed: () {
                              // TODO: Call client
                            },
                          ),
                        IconButton(
                          icon: const Icon(Icons.chevron_right),
                          onPressed: () {
                            if (appointment.client != null) {
                              context.go('/clients/${appointment.client!.id}');
                            }
                          },
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Services
                if (appointment.services != null &&
                    appointment.services!.isNotEmpty)
                  _buildSection(
                    context,
                    title: 'Services',
                    child: Column(
                      children: appointment.services!.map((service) {
                        return ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: Container(
                            width: 4,
                            height: 40,
                            decoration: BoxDecoration(
                              color: service.categoryColor,
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                          title: Text(service.name),
                          subtitle: Text(service.formattedDuration),
                          trailing: Text(
                            service.formattedPrice,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                const SizedBox(height: 16),

                // Staff
                if (appointment.staff != null)
                  _buildSection(
                    context,
                    title: 'Staff Member',
                    child: ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: CircleAvatar(
                        backgroundColor: appointment.staff!.avatarColor,
                        child: Text(
                          appointment.staff!.initials,
                          style: const TextStyle(color: Colors.white),
                        ),
                      ),
                      title: Text(appointment.staff!.fullName),
                      subtitle: Text(appointment.staff!.role),
                    ),
                  ),
                const SizedBox(height: 16),

                // Notes
                if (appointment.notes != null && appointment.notes!.isNotEmpty)
                  _buildSection(
                    context,
                    title: 'Notes',
                    child: Text(appointment.notes!),
                  ),
                const SizedBox(height: 16),

                // Total
                Card(
                  color: AppColors.primary.withOpacity(0.1),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Total',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          '\$${appointment.totalPrice.toStringAsFixed(2)}',
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Action buttons
                if (appointment.status != AppointmentStatus.completed &&
                    appointment.status != AppointmentStatus.cancelled)
                  _buildActionButtons(context, ref, appointment),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildSection(
    BuildContext context, {
    required String title,
    required Widget child,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 8),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: child,
          ),
        ),
      ],
    );
  }

  Widget _buildInfoItem(
    BuildContext context, {
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Column(
      children: [
        Icon(icon, color: AppColors.primary),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            color: Colors.grey[600],
            fontSize: 12,
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildActionButtons(
    BuildContext context,
    WidgetRef ref,
    Appointment appointment,
  ) {
    return Column(
      children: [
        if (appointment.status == AppointmentStatus.scheduled)
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () async {
                await ref.read(appointmentsProvider.notifier).updateStatus(
                      appointment.id,
                      AppointmentStatus.confirmed,
                    );
                ref.invalidate(appointmentDetailProvider(appointmentId));
              },
              icon: const Icon(Icons.check),
              label: const Text('Confirm Appointment'),
            ),
          ),
        if (appointment.status == AppointmentStatus.confirmed)
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () async {
                await ref.read(appointmentsProvider.notifier).updateStatus(
                      appointment.id,
                      AppointmentStatus.inProgress,
                    );
                ref.invalidate(appointmentDetailProvider(appointmentId));
              },
              icon: const Icon(Icons.play_arrow),
              label: const Text('Start Appointment'),
            ),
          ),
        if (appointment.status == AppointmentStatus.inProgress)
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () async {
                await ref.read(appointmentsProvider.notifier).updateStatus(
                      appointment.id,
                      AppointmentStatus.completed,
                    );
                ref.invalidate(appointmentDetailProvider(appointmentId));
              },
              icon: const Icon(Icons.done),
              label: const Text('Complete Appointment'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.success,
              ),
            ),
          ),
        const SizedBox(height: 8),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: () => _showCancelDialog(context, ref),
            icon: const Icon(Icons.cancel, color: AppColors.error),
            label: const Text(
              'Cancel Appointment',
              style: TextStyle(color: AppColors.error),
            ),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: AppColors.error),
            ),
          ),
        ),
      ],
    );
  }

  void _showCancelDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Appointment'),
        content: const Text('Are you sure you want to cancel this appointment?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('No'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              await ref
                  .read(appointmentsProvider.notifier)
                  .cancelAppointment(appointmentId);
              if (context.mounted) {
                context.pop();
              }
            },
            child: const Text('Yes, Cancel'),
          ),
        ],
      ),
    );
  }

  void _showDeleteDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Appointment'),
        content: const Text(
            'Are you sure you want to delete this appointment? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              final service = ref.read(appointmentServiceProvider);
              await service.deleteAppointment(appointmentId);
              if (context.mounted) {
                context.pop();
              }
            },
            child: const Text(
              'Delete',
              style: TextStyle(color: AppColors.error),
            ),
          ),
        ],
      ),
    );
  }
}
