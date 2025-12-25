import 'package:equatable/equatable.dart';

class DashboardStats extends Equatable {
  final int todayAppointments;
  final int upcomingAppointments;
  final double todayRevenue;
  final double weekRevenue;
  final double monthRevenue;
  final int newClients;
  final int totalClients;
  final int completedAppointments;
  final int cancelledAppointments;
  final double averageRating;
  final int totalReviews;

  const DashboardStats({
    required this.todayAppointments,
    required this.upcomingAppointments,
    required this.todayRevenue,
    required this.weekRevenue,
    required this.monthRevenue,
    required this.newClients,
    required this.totalClients,
    required this.completedAppointments,
    required this.cancelledAppointments,
    required this.averageRating,
    required this.totalReviews,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      todayAppointments: json['todayAppointments'] as int? ?? 0,
      upcomingAppointments: json['upcomingAppointments'] as int? ?? 0,
      todayRevenue: (json['todayRevenue'] as num?)?.toDouble() ?? 0,
      weekRevenue: (json['weekRevenue'] as num?)?.toDouble() ?? 0,
      monthRevenue: (json['monthRevenue'] as num?)?.toDouble() ?? 0,
      newClients: json['newClients'] as int? ?? 0,
      totalClients: json['totalClients'] as int? ?? 0,
      completedAppointments: json['completedAppointments'] as int? ?? 0,
      cancelledAppointments: json['cancelledAppointments'] as int? ?? 0,
      averageRating: (json['averageRating'] as num?)?.toDouble() ?? 0,
      totalReviews: json['totalReviews'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'todayAppointments': todayAppointments,
      'upcomingAppointments': upcomingAppointments,
      'todayRevenue': todayRevenue,
      'weekRevenue': weekRevenue,
      'monthRevenue': monthRevenue,
      'newClients': newClients,
      'totalClients': totalClients,
      'completedAppointments': completedAppointments,
      'cancelledAppointments': cancelledAppointments,
      'averageRating': averageRating,
      'totalReviews': totalReviews,
    };
  }

  factory DashboardStats.empty() {
    return const DashboardStats(
      todayAppointments: 0,
      upcomingAppointments: 0,
      todayRevenue: 0,
      weekRevenue: 0,
      monthRevenue: 0,
      newClients: 0,
      totalClients: 0,
      completedAppointments: 0,
      cancelledAppointments: 0,
      averageRating: 0,
      totalReviews: 0,
    );
  }

  @override
  List<Object?> get props => [
        todayAppointments,
        upcomingAppointments,
        todayRevenue,
        weekRevenue,
        monthRevenue,
        newClients,
        totalClients,
        completedAppointments,
        cancelledAppointments,
        averageRating,
        totalReviews,
      ];
}
