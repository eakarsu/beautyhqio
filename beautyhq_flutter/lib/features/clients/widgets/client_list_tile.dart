import 'package:flutter/material.dart';
import 'package:beautyhq_flutter/core/models/client.dart';

class ClientListTile extends StatelessWidget {
  final Client client;
  final VoidCallback? onTap;

  const ClientListTile({
    super.key,
    required this.client,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(vertical: 8),
      leading: CircleAvatar(
        radius: 24,
        backgroundColor: client.avatarColor,
        backgroundImage:
            client.avatarUrl != null ? NetworkImage(client.avatarUrl!) : null,
        child: client.avatarUrl == null
            ? Text(
                client.initials,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              )
            : null,
      ),
      title: Text(
        client.fullName,
        style: const TextStyle(
          fontWeight: FontWeight.w600,
        ),
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (client.email != null)
            Text(
              client.email!,
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 13,
              ),
            ),
          const SizedBox(height: 4),
          Row(
            children: [
              Icon(
                Icons.star,
                size: 14,
                color: Colors.amber[600],
              ),
              const SizedBox(width: 4),
              Text(
                '${client.loyaltyPoints} pts',
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 12,
                ),
              ),
              const SizedBox(width: 12),
              Icon(
                Icons.calendar_today,
                size: 14,
                color: Colors.grey[500],
              ),
              const SizedBox(width: 4),
              Text(
                '${client.totalVisits} visits',
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ],
      ),
      trailing: const Icon(Icons.chevron_right),
    );
  }
}
