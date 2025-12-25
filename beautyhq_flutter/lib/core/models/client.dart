import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';

class Client extends Equatable {
  final String id;
  final String firstName;
  final String lastName;
  final String? email;
  final String? phone;
  final String? avatarUrl;
  final String? notes;
  final int loyaltyPoints;
  final int totalVisits;
  final double totalSpent;
  final DateTime? lastVisit;
  final DateTime? birthday;
  final List<String>? tags;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Client({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.email,
    this.phone,
    this.avatarUrl,
    this.notes,
    this.loyaltyPoints = 0,
    this.totalVisits = 0,
    this.totalSpent = 0,
    this.lastVisit,
    this.birthday,
    this.tags,
    required this.createdAt,
    required this.updatedAt,
  });

  String get fullName => '$firstName $lastName';

  String get initials {
    final firstInitial = firstName.isNotEmpty ? firstName[0].toUpperCase() : '';
    final lastInitial = lastName.isNotEmpty ? lastName[0].toUpperCase() : '';
    return '$firstInitial$lastInitial';
  }

  Color get avatarColor {
    final hash = fullName.hashCode;
    final colors = [
      Colors.purple,
      Colors.blue,
      Colors.teal,
      Colors.green,
      Colors.orange,
      Colors.pink,
      Colors.indigo,
      Colors.cyan,
    ];
    return colors[hash.abs() % colors.length];
  }

  factory Client.fromJson(Map<String, dynamic> json) {
    return Client(
      id: json['id'] as String,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      notes: json['notes'] as String?,
      loyaltyPoints: json['loyaltyPoints'] as int? ?? 0,
      totalVisits: json['totalVisits'] as int? ?? 0,
      totalSpent: (json['totalSpent'] as num?)?.toDouble() ?? 0,
      lastVisit: json['lastVisit'] != null
          ? DateTime.parse(json['lastVisit'] as String)
          : null,
      birthday: json['birthday'] != null
          ? DateTime.parse(json['birthday'] as String)
          : null,
      tags: json['tags'] != null
          ? List<String>.from(json['tags'] as List)
          : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'firstName': firstName,
      'lastName': lastName,
      'email': email,
      'phone': phone,
      'avatarUrl': avatarUrl,
      'notes': notes,
      'loyaltyPoints': loyaltyPoints,
      'totalVisits': totalVisits,
      'totalSpent': totalSpent,
      'lastVisit': lastVisit?.toIso8601String(),
      'birthday': birthday?.toIso8601String(),
      'tags': tags,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  Client copyWith({
    String? id,
    String? firstName,
    String? lastName,
    String? email,
    String? phone,
    String? avatarUrl,
    String? notes,
    int? loyaltyPoints,
    int? totalVisits,
    double? totalSpent,
    DateTime? lastVisit,
    DateTime? birthday,
    List<String>? tags,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Client(
      id: id ?? this.id,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      notes: notes ?? this.notes,
      loyaltyPoints: loyaltyPoints ?? this.loyaltyPoints,
      totalVisits: totalVisits ?? this.totalVisits,
      totalSpent: totalSpent ?? this.totalSpent,
      lastVisit: lastVisit ?? this.lastVisit,
      birthday: birthday ?? this.birthday,
      tags: tags ?? this.tags,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [
        id,
        firstName,
        lastName,
        email,
        phone,
        avatarUrl,
        notes,
        loyaltyPoints,
        totalVisits,
        totalSpent,
        lastVisit,
        birthday,
        tags,
        createdAt,
        updatedAt,
      ];
}
