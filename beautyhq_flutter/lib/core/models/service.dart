import 'package:equatable/equatable.dart';
import 'package:flutter/material.dart';

class Service extends Equatable {
  final String id;
  final String name;
  final String? description;
  final double price;
  final int duration;
  final String? categoryId;
  final String? category;
  final String? imageUrl;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Service({
    required this.id,
    required this.name,
    this.description,
    required this.price,
    required this.duration,
    this.categoryId,
    this.category,
    this.imageUrl,
    this.isActive = true,
    required this.createdAt,
    required this.updatedAt,
  });

  String get formattedDuration {
    if (duration >= 60) {
      final hours = duration ~/ 60;
      final minutes = duration % 60;
      if (minutes == 0) {
        return '${hours}h';
      }
      return '${hours}h ${minutes}m';
    }
    return '${duration}m';
  }

  String get formattedPrice => '\$${price.toStringAsFixed(2)}';

  Color get categoryColor {
    final hash = (category ?? name).hashCode;
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

  factory Service.fromJson(Map<String, dynamic> json) {
    return Service(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      price: (json['price'] as num).toDouble(),
      duration: json['duration'] as int,
      categoryId: json['categoryId'] as String?,
      category: json['category'] as String?,
      imageUrl: json['imageUrl'] as String?,
      isActive: json['isActive'] as bool? ?? true,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'price': price,
      'duration': duration,
      'categoryId': categoryId,
      'category': category,
      'imageUrl': imageUrl,
      'isActive': isActive,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  Service copyWith({
    String? id,
    String? name,
    String? description,
    double? price,
    int? duration,
    String? categoryId,
    String? category,
    String? imageUrl,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Service(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      price: price ?? this.price,
      duration: duration ?? this.duration,
      categoryId: categoryId ?? this.categoryId,
      category: category ?? this.category,
      imageUrl: imageUrl ?? this.imageUrl,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [
        id,
        name,
        description,
        price,
        duration,
        categoryId,
        category,
        imageUrl,
        isActive,
        createdAt,
        updatedAt,
      ];
}
