import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';
import 'package:beautyhq_flutter/core/models/client.dart';
import 'package:beautyhq_flutter/core/models/service.dart';
import 'package:beautyhq_flutter/core/models/staff.dart';

enum AppointmentStatus {
  scheduled,
  confirmed,
  inProgress,
  completed,
  cancelled,
  noShow,
}

extension AppointmentStatusExtension on AppointmentStatus {
  String get displayName {
    switch (this) {
      case AppointmentStatus.scheduled:
        return 'Scheduled';
      case AppointmentStatus.confirmed:
        return 'Confirmed';
      case AppointmentStatus.inProgress:
        return 'In Progress';
      case AppointmentStatus.completed:
        return 'Completed';
      case AppointmentStatus.cancelled:
        return 'Cancelled';
      case AppointmentStatus.noShow:
        return 'No Show';
    }
  }

  Color get color {
    switch (this) {
      case AppointmentStatus.scheduled:
        return Colors.blue;
      case AppointmentStatus.confirmed:
        return Colors.green;
      case AppointmentStatus.inProgress:
        return Colors.orange;
      case AppointmentStatus.completed:
        return Colors.grey;
      case AppointmentStatus.cancelled:
        return Colors.red;
      case AppointmentStatus.noShow:
        return Colors.purple;
    }
  }

  Color get backgroundColor {
    return color.withOpacity(0.1);
  }

  IconData get icon {
    switch (this) {
      case AppointmentStatus.scheduled:
        return Icons.schedule;
      case AppointmentStatus.confirmed:
        return Icons.check_circle;
      case AppointmentStatus.inProgress:
        return Icons.play_circle;
      case AppointmentStatus.completed:
        return Icons.done_all;
      case AppointmentStatus.cancelled:
        return Icons.cancel;
      case AppointmentStatus.noShow:
        return Icons.person_off;
    }
  }

  static AppointmentStatus fromString(String value) {
    switch (value.toLowerCase()) {
      case 'scheduled':
        return AppointmentStatus.scheduled;
      case 'confirmed':
        return AppointmentStatus.confirmed;
      case 'in_progress':
      case 'inprogress':
        return AppointmentStatus.inProgress;
      case 'completed':
        return AppointmentStatus.completed;
      case 'cancelled':
      case 'canceled':
        return AppointmentStatus.cancelled;
      case 'no_show':
      case 'noshow':
        return AppointmentStatus.noShow;
      default:
        return AppointmentStatus.scheduled;
    }
  }
}

class Appointment extends Equatable {
  final String id;
  final String clientId;
  final String? staffId;
  final String businessId;
  final Client? client;
  final Staff? staff;
  final List<Service>? services;
  final DateTime startTime;
  final DateTime endTime;
  final AppointmentStatus status;
  final String? notes;
  final double totalPrice;
  final int totalDuration;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Appointment({
    required this.id,
    required this.clientId,
    this.staffId,
    required this.businessId,
    this.client,
    this.staff,
    this.services,
    required this.startTime,
    required this.endTime,
    required this.status,
    this.notes,
    required this.totalPrice,
    required this.totalDuration,
    required this.createdAt,
    required this.updatedAt,
  });

  bool get isToday {
    final now = DateTime.now();
    return startTime.year == now.year &&
        startTime.month == now.month &&
        startTime.day == now.day;
  }

  bool get isPast => endTime.isBefore(DateTime.now());

  bool get isUpcoming => startTime.isAfter(DateTime.now());

  factory Appointment.fromJson(Map<String, dynamic> json) {
    return Appointment(
      id: json['id'] as String,
      clientId: json['clientId'] as String,
      staffId: json['staffId'] as String?,
      businessId: json['businessId'] as String,
      client: json['client'] != null
          ? Client.fromJson(json['client'] as Map<String, dynamic>)
          : null,
      staff: json['staff'] != null
          ? Staff.fromJson(json['staff'] as Map<String, dynamic>)
          : null,
      services: json['services'] != null
          ? (json['services'] as List)
              .map((s) => Service.fromJson(s as Map<String, dynamic>))
              .toList()
          : null,
      startTime: DateTime.parse(json['startTime'] as String),
      endTime: DateTime.parse(json['endTime'] as String),
      status: AppointmentStatusExtension.fromString(json['status'] as String),
      notes: json['notes'] as String?,
      totalPrice: (json['totalPrice'] as num).toDouble(),
      totalDuration: json['totalDuration'] as int,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'clientId': clientId,
      'staffId': staffId,
      'businessId': businessId,
      'client': client?.toJson(),
      'staff': staff?.toJson(),
      'services': services?.map((s) => s.toJson()).toList(),
      'startTime': startTime.toIso8601String(),
      'endTime': endTime.toIso8601String(),
      'status': status.name,
      'notes': notes,
      'totalPrice': totalPrice,
      'totalDuration': totalDuration,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  Appointment copyWith({
    String? id,
    String? clientId,
    String? staffId,
    String? businessId,
    Client? client,
    Staff? staff,
    List<Service>? services,
    DateTime? startTime,
    DateTime? endTime,
    AppointmentStatus? status,
    String? notes,
    double? totalPrice,
    int? totalDuration,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Appointment(
      id: id ?? this.id,
      clientId: clientId ?? this.clientId,
      staffId: staffId ?? this.staffId,
      businessId: businessId ?? this.businessId,
      client: client ?? this.client,
      staff: staff ?? this.staff,
      services: services ?? this.services,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      status: status ?? this.status,
      notes: notes ?? this.notes,
      totalPrice: totalPrice ?? this.totalPrice,
      totalDuration: totalDuration ?? this.totalDuration,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [
        id,
        clientId,
        staffId,
        businessId,
        client,
        staff,
        services,
        startTime,
        endTime,
        status,
        notes,
        totalPrice,
        totalDuration,
        createdAt,
        updatedAt,
      ];
}
