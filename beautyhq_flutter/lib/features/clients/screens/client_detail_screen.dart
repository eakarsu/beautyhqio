import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:beautyhq_flutter/app/theme.dart';
import 'package:beautyhq_flutter/core/models/client.dart';
import 'package:beautyhq_flutter/core/models/appointment.dart';
import 'package:beautyhq_flutter/core/services/client_service.dart';
import 'package:beautyhq_flutter/features/clients/providers/clients_provider.dart';
import 'package:beautyhq_flutter/features/dashboard/widgets/appointment_card.dart';

final clientDetailProvider =
    FutureProvider.family<Client?, String>((ref, id) async {
  final service = ref.watch(clientServiceProvider);
  return service.getClient(id);
});

final clientAppointmentsProvider =
    FutureProvider.family<List<Appointment>, String>((ref, clientId) async {
  final service = ref.watch(clientServiceProvider);
  return service.getClientAppointments(clientId);
});

class ClientDetailScreen extends ConsumerWidget {
  final String clientId;

  const ClientDetailScreen({
    super.key,
    required this.clientId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final clientAsync = ref.watch(clientDetailProvider(clientId));
    final appointmentsAsync = ref.watch(clientAppointmentsProvider(clientId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Client Details'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () {
              // TODO: Navigate to edit client
            },
          ),
          PopupMenuButton<String>(
            onSelected: (value) async {
              switch (value) {
                case 'delete':
                  _showDeleteDialog(context, ref);
                  break;
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'delete',
                child: Row(
                  children: [
                    Icon(Icons.delete, color: AppColors.error),
                    SizedBox(width: 8),
                    Text('Delete Client'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: clientAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Error: $error')),
        data: (client) {
          if (client == null) {
            return const Center(child: Text('Client not found'));
          }

          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Profile header
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        AppColors.primary,
                        AppColors.primary.withOpacity(0.8),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: Column(
                    children: [
                      CircleAvatar(
                        radius: 48,
                        backgroundColor: Colors.white,
                        backgroundImage: client.avatarUrl != null
                            ? NetworkImage(client.avatarUrl!)
                            : null,
                        child: client.avatarUrl == null
                            ? Text(
                                client.initials,
                                style: TextStyle(
                                  fontSize: 36,
                                  fontWeight: FontWeight.bold,
                                  color: client.avatarColor,
                                ),
                              )
                            : null,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        client.fullName,
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      if (client.email != null)
                        Text(
                          client.email!,
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.9),
                          ),
                        ),
                      const SizedBox(height: 16),

                      // Quick actions
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          if (client.phone != null) ...[
                            _buildQuickAction(
                              icon: Icons.phone,
                              label: 'Call',
                              onTap: () {
                                // TODO: Call client
                              },
                            ),
                            const SizedBox(width: 24),
                            _buildQuickAction(
                              icon: Icons.message,
                              label: 'Message',
                              onTap: () {
                                // TODO: Message client
                              },
                            ),
                            const SizedBox(width: 24),
                          ],
                          _buildQuickAction(
                            icon: Icons.calendar_today,
                            label: 'Book',
                            onTap: () {
                              // TODO: Book appointment
                            },
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Stats
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Expanded(
                        child: _buildStatCard(
                          context,
                          icon: Icons.star,
                          value: '${client.loyaltyPoints}',
                          label: 'Points',
                          color: Colors.amber,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildStatCard(
                          context,
                          icon: Icons.calendar_today,
                          value: '${client.totalVisits}',
                          label: 'Visits',
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildStatCard(
                          context,
                          icon: Icons.attach_money,
                          value: '\$${client.totalSpent.toStringAsFixed(0)}',
                          label: 'Spent',
                          color: AppColors.success,
                        ),
                      ),
                    ],
                  ),
                ),

                // Contact info
                _buildSection(
                  context,
                  title: 'Contact Information',
                  children: [
                    if (client.phone != null)
                      _buildInfoRow(
                        icon: Icons.phone,
                        label: 'Phone',
                        value: client.phone!,
                      ),
                    if (client.email != null)
                      _buildInfoRow(
                        icon: Icons.email,
                        label: 'Email',
                        value: client.email!,
                      ),
                    if (client.birthday != null)
                      _buildInfoRow(
                        icon: Icons.cake,
                        label: 'Birthday',
                        value: DateFormat('MMMM d, yyyy')
                            .format(client.birthday!),
                      ),
                    if (client.lastVisit != null)
                      _buildInfoRow(
                        icon: Icons.history,
                        label: 'Last Visit',
                        value: DateFormat('MMM d, yyyy')
                            .format(client.lastVisit!),
                      ),
                  ],
                ),

                // Tags
                if (client.tags != null && client.tags!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Tags',
                          style:
                              Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: client.tags!.map((tag) {
                            return Chip(
                              label: Text(tag),
                              backgroundColor:
                                  AppColors.primary.withOpacity(0.1),
                              labelStyle: const TextStyle(
                                color: AppColors.primary,
                              ),
                            );
                          }).toList(),
                        ),
                      ],
                    ),
                  ),
                const SizedBox(height: 16),

                // Notes
                if (client.notes != null && client.notes!.isNotEmpty)
                  _buildSection(
                    context,
                    title: 'Notes',
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: Text(client.notes!),
                      ),
                    ],
                  ),

                // Appointments
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Recent Appointments',
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium
                                ?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                          TextButton(
                            onPressed: () {
                              // TODO: View all appointments
                            },
                            child: const Text('View All'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      appointmentsAsync.when(
                        loading: () =>
                            const Center(child: CircularProgressIndicator()),
                        error: (_, __) =>
                            const Text('Failed to load appointments'),
                        data: (appointments) {
                          if (appointments.isEmpty) {
                            return Card(
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
                                        'No appointments yet',
                                        style:
                                            TextStyle(color: Colors.grey[600]),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          }

                          return Column(
                            children: appointments.map((appointment) {
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: AppointmentCard(
                                  appointment: appointment,
                                  onTap: () => context
                                      .go('/appointments/${appointment.id}'),
                                ),
                              );
                            }).toList(),
                          );
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),
              ],
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          // TODO: Book new appointment for client
        },
        icon: const Icon(Icons.add),
        label: const Text('Book Appointment'),
      ),
    );
  }

  Widget _buildQuickAction({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withOpacity(0.9),
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(
    BuildContext context, {
    required IconData icon,
    required String value,
    required String label,
    required Color color,
  }) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 8),
            Text(
              value,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            Text(
              label,
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(
    BuildContext context, {
    required String title,
    required List<Widget> children,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
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
            child: Column(children: children),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return ListTile(
      leading: Icon(icon, color: AppColors.primary),
      title: Text(label),
      subtitle: Text(value),
    );
  }

  void _showDeleteDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Client'),
        content: const Text(
            'Are you sure you want to delete this client? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              final service = ref.read(clientServiceProvider);
              await service.deleteClient(clientId);
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
