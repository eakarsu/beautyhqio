import 'package:equatable/equatable.dart';

class Business extends Equatable {
  final String id;
  final String name;
  final String? description;
  final String? logoUrl;
  final String? phone;
  final String? email;
  final String? website;
  final Address? address;
  final BusinessHours? hours;
  final String timezone;
  final String currency;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Business({
    required this.id,
    required this.name,
    this.description,
    this.logoUrl,
    this.phone,
    this.email,
    this.website,
    this.address,
    this.hours,
    required this.timezone,
    required this.currency,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Business.fromJson(Map<String, dynamic> json) {
    return Business(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      logoUrl: json['logoUrl'] as String?,
      phone: json['phone'] as String?,
      email: json['email'] as String?,
      website: json['website'] as String?,
      address: json['address'] != null
          ? Address.fromJson(json['address'] as Map<String, dynamic>)
          : null,
      hours: json['hours'] != null
          ? BusinessHours.fromJson(json['hours'] as Map<String, dynamic>)
          : null,
      timezone: json['timezone'] as String? ?? 'UTC',
      currency: json['currency'] as String? ?? 'USD',
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'logoUrl': logoUrl,
      'phone': phone,
      'email': email,
      'website': website,
      'address': address?.toJson(),
      'hours': hours?.toJson(),
      'timezone': timezone,
      'currency': currency,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  @override
  List<Object?> get props => [
        id,
        name,
        description,
        logoUrl,
        phone,
        email,
        website,
        address,
        hours,
        timezone,
        currency,
        createdAt,
        updatedAt,
      ];
}

class Address extends Equatable {
  final String street;
  final String? street2;
  final String city;
  final String state;
  final String postalCode;
  final String country;

  const Address({
    required this.street,
    this.street2,
    required this.city,
    required this.state,
    required this.postalCode,
    required this.country,
  });

  String get formatted => '$street, $city, $state $postalCode';

  factory Address.fromJson(Map<String, dynamic> json) {
    return Address(
      street: json['street'] as String,
      street2: json['street2'] as String?,
      city: json['city'] as String,
      state: json['state'] as String,
      postalCode: json['postalCode'] as String,
      country: json['country'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'street': street,
      'street2': street2,
      'city': city,
      'state': state,
      'postalCode': postalCode,
      'country': country,
    };
  }

  @override
  List<Object?> get props => [street, street2, city, state, postalCode, country];
}

class BusinessHours extends Equatable {
  final DayHours? monday;
  final DayHours? tuesday;
  final DayHours? wednesday;
  final DayHours? thursday;
  final DayHours? friday;
  final DayHours? saturday;
  final DayHours? sunday;

  const BusinessHours({
    this.monday,
    this.tuesday,
    this.wednesday,
    this.thursday,
    this.friday,
    this.saturday,
    this.sunday,
  });

  factory BusinessHours.fromJson(Map<String, dynamic> json) {
    return BusinessHours(
      monday: json['monday'] != null
          ? DayHours.fromJson(json['monday'] as Map<String, dynamic>)
          : null,
      tuesday: json['tuesday'] != null
          ? DayHours.fromJson(json['tuesday'] as Map<String, dynamic>)
          : null,
      wednesday: json['wednesday'] != null
          ? DayHours.fromJson(json['wednesday'] as Map<String, dynamic>)
          : null,
      thursday: json['thursday'] != null
          ? DayHours.fromJson(json['thursday'] as Map<String, dynamic>)
          : null,
      friday: json['friday'] != null
          ? DayHours.fromJson(json['friday'] as Map<String, dynamic>)
          : null,
      saturday: json['saturday'] != null
          ? DayHours.fromJson(json['saturday'] as Map<String, dynamic>)
          : null,
      sunday: json['sunday'] != null
          ? DayHours.fromJson(json['sunday'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'monday': monday?.toJson(),
      'tuesday': tuesday?.toJson(),
      'wednesday': wednesday?.toJson(),
      'thursday': thursday?.toJson(),
      'friday': friday?.toJson(),
      'saturday': saturday?.toJson(),
      'sunday': sunday?.toJson(),
    };
  }

  @override
  List<Object?> get props =>
      [monday, tuesday, wednesday, thursday, friday, saturday, sunday];
}

class DayHours extends Equatable {
  final String open;
  final String close;
  final bool isClosed;

  const DayHours({
    required this.open,
    required this.close,
    this.isClosed = false,
  });

  factory DayHours.fromJson(Map<String, dynamic> json) {
    return DayHours(
      open: json['open'] as String,
      close: json['close'] as String,
      isClosed: json['isClosed'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'open': open,
      'close': close,
      'isClosed': isClosed,
    };
  }

  @override
  List<Object?> get props => [open, close, isClosed];
}
