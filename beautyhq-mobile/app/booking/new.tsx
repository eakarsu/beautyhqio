import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Avatar, Button, LoadingSpinner } from '../../src/components/ui';
import { colors } from '../../src/utils/colors';
import { clientsService, servicesService, staffService, appointmentsService } from '../../src/services';
import { Client, Service, Staff } from '../../src/types';
import { formatCurrency, formatDate, formatTime } from '../../src/utils/helpers';

type Step = 'client' | 'service' | 'staff' | 'datetime' | 'confirm';

export default function NewBookingScreen() {
  const { clientId } = useLocalSearchParams<{ clientId?: string }>();

  const [currentStep, setCurrentStep] = useState<Step>(clientId ? 'service' : 'client');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  // Selections
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [clientsRes, servicesRes] = await Promise.all([
          clientsService.getClients({ pageSize: 100 }),
          servicesService.getServices({ isActive: true }),
        ]);

        if (clientsRes.data) {
          setClients(clientsRes.data.data || []);
          if (clientId) {
            const client = clientsRes.data.data?.find((c) => c.id === clientId);
            if (client) setSelectedClient(client);
          }
        }
        if (servicesRes.data) {
          setServices(servicesRes.data);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [clientId]);

  // Load staff when service is selected
  useEffect(() => {
    if (selectedService) {
      const loadStaff = async () => {
        const response = await staffService.getStaffByService(selectedService.id);
        if (response.data) {
          setStaff(response.data);
        }
      };
      loadStaff();
    }
  }, [selectedService]);

  // Load available slots when staff and date are selected
  useEffect(() => {
    if (selectedStaff && selectedService && selectedDate) {
      const loadSlots = async () => {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const response = await appointmentsService.getAvailableSlots(
          selectedStaff.id,
          selectedService.id,
          dateStr
        );
        if (response.data) {
          setAvailableSlots(response.data);
        }
      };
      loadSlots();
    }
  }, [selectedStaff, selectedService, selectedDate]);

  const handleNext = () => {
    const steps: Step[] = ['client', 'service', 'staff', 'datetime', 'confirm'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: Step[] = ['client', 'service', 'staff', 'datetime', 'confirm'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    } else {
      router.back();
    }
  };

  const handleBook = async () => {
    if (!selectedClient || !selectedService || !selectedStaff || !selectedTime) {
      Alert.alert('Error', 'Please complete all selections');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await appointmentsService.createAppointment({
        clientId: selectedClient.id,
        serviceId: selectedService.id,
        staffId: selectedStaff.id,
        startTime: selectedTime,
        notes,
      });

      if (response.data) {
        Alert.alert('Success', 'Appointment booked successfully!', [
          {
            text: 'View Appointment',
            onPress: () => router.replace(`/appointment/${response.data!.id}`),
          },
          {
            text: 'Done',
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert('Error', response.error || 'Failed to book appointment');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to book appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWeekDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'client':
        return !!selectedClient;
      case 'service':
        return !!selectedService;
      case 'staff':
        return !!selectedStaff;
      case 'datetime':
        return !!selectedTime;
      default:
        return true;
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'New Booking',
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.headerBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          {['client', 'service', 'staff', 'datetime', 'confirm'].map((step, index) => (
            <View
              key={step}
              style={[
                styles.progressStep,
                currentStep === step && styles.progressStepActive,
                ['client', 'service', 'staff', 'datetime', 'confirm'].indexOf(currentStep) > index &&
                  styles.progressStepComplete,
              ]}
            />
          ))}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Client Selection */}
          {currentStep === 'client' && (
            <View>
              <Text style={styles.stepTitle}>Select Client</Text>
              {clients.map((client) => (
                <TouchableOpacity
                  key={client.id}
                  onPress={() => setSelectedClient(client)}
                >
                  <Card
                    variant={selectedClient?.id === client.id ? 'elevated' : 'outlined'}
                    style={[
                      styles.selectionCard,
                      selectedClient?.id === client.id && styles.selectedCard,
                    ]}
                  >
                    <Avatar
                      source={client.profileImage}
                      firstName={client.firstName}
                      lastName={client.lastName}
                      size="medium"
                    />
                    <View style={styles.selectionInfo}>
                      <Text style={styles.selectionTitle}>
                        {client.firstName} {client.lastName}
                      </Text>
                      <Text style={styles.selectionSubtitle}>{client.phone || client.email}</Text>
                    </View>
                    {selectedClient?.id === client.id && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary[600]} />
                    )}
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Service Selection */}
          {currentStep === 'service' && (
            <View>
              <Text style={styles.stepTitle}>Select Service</Text>
              {services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  onPress={() => setSelectedService(service)}
                >
                  <Card
                    variant={selectedService?.id === service.id ? 'elevated' : 'outlined'}
                    style={[
                      styles.selectionCard,
                      selectedService?.id === service.id && styles.selectedCard,
                    ]}
                  >
                    <View style={styles.serviceIcon}>
                      <Ionicons name="cut" size={24} color={colors.primary[600]} />
                    </View>
                    <View style={styles.selectionInfo}>
                      <Text style={styles.selectionTitle}>{service.name}</Text>
                      <Text style={styles.selectionSubtitle}>
                        {service.duration} min • {formatCurrency(service.price)}
                      </Text>
                    </View>
                    {selectedService?.id === service.id && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary[600]} />
                    )}
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Staff Selection */}
          {currentStep === 'staff' && (
            <View>
              <Text style={styles.stepTitle}>Select Stylist</Text>
              {staff.map((member) => (
                <TouchableOpacity
                  key={member.id}
                  onPress={() => setSelectedStaff(member)}
                >
                  <Card
                    variant={selectedStaff?.id === member.id ? 'elevated' : 'outlined'}
                    style={[
                      styles.selectionCard,
                      selectedStaff?.id === member.id && styles.selectedCard,
                    ]}
                  >
                    <Avatar
                      source={member.profileImage}
                      firstName={member.firstName}
                      lastName={member.lastName}
                      size="medium"
                    />
                    <View style={styles.selectionInfo}>
                      <Text style={styles.selectionTitle}>
                        {member.firstName} {member.lastName}
                      </Text>
                      <Text style={styles.selectionSubtitle}>{member.title || 'Stylist'}</Text>
                    </View>
                    {selectedStaff?.id === member.id && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary[600]} />
                    )}
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Date & Time Selection */}
          {currentStep === 'datetime' && (
            <View>
              <Text style={styles.stepTitle}>Select Date & Time</Text>

              {/* Date Picker */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datePicker}>
                {getWeekDates().map((date) => {
                  const isSelected = date.toDateString() === selectedDate.toDateString();
                  return (
                    <TouchableOpacity
                      key={date.toISOString()}
                      style={[styles.dateItem, isSelected && styles.dateItemSelected]}
                      onPress={() => {
                        setSelectedDate(date);
                        setSelectedTime(null);
                      }}
                    >
                      <Text style={[styles.dateDayName, isSelected && styles.dateTextSelected]}>
                        {formatDate(date, 'EEE')}
                      </Text>
                      <Text style={[styles.dateDay, isSelected && styles.dateTextSelected]}>
                        {formatDate(date, 'd')}
                      </Text>
                      <Text style={[styles.dateMonth, isSelected && styles.dateTextSelected]}>
                        {formatDate(date, 'MMM')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Time Slots */}
              <Text style={styles.timeSlotsTitle}>Available Times</Text>
              <View style={styles.timeSlots}>
                {availableSlots.length === 0 ? (
                  <Text style={styles.noSlotsText}>No available times for this date</Text>
                ) : (
                  availableSlots.map((slot) => {
                    const isSelected = selectedTime === slot;
                    return (
                      <TouchableOpacity
                        key={slot}
                        style={[styles.timeSlot, isSelected && styles.timeSlotSelected]}
                        onPress={() => setSelectedTime(slot)}
                      >
                        <Text style={[styles.timeSlotText, isSelected && styles.timeSlotTextSelected]}>
                          {formatTime(slot)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </View>
          )}

          {/* Confirmation */}
          {currentStep === 'confirm' && (
            <View>
              <Text style={styles.stepTitle}>Confirm Booking</Text>

              <Card variant="elevated" style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Client</Text>
                  <Text style={styles.summaryValue}>
                    {selectedClient?.firstName} {selectedClient?.lastName}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Service</Text>
                  <Text style={styles.summaryValue}>{selectedService?.name}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Stylist</Text>
                  <Text style={styles.summaryValue}>
                    {selectedStaff?.firstName} {selectedStaff?.lastName}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Date & Time</Text>
                  <Text style={styles.summaryValue}>
                    {selectedTime && formatDate(selectedTime, 'EEEE, MMM d')} at{' '}
                    {selectedTime && formatTime(selectedTime)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Duration</Text>
                  <Text style={styles.summaryValue}>{selectedService?.duration} minutes</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>
                    {formatCurrency(selectedService?.price || 0)}
                  </Text>
                </View>
              </Card>
            </View>
          )}
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          {currentStep === 'confirm' ? (
            <Button
              title="Confirm Booking"
              onPress={handleBook}
              loading={isSubmitting}
              fullWidth
              size="large"
            />
          ) : (
            <Button
              title="Continue"
              onPress={handleNext}
              disabled={!canProceed()}
              fullWidth
              size="large"
            />
          )}
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  headerBtn: {
    padding: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
    backgroundColor: colors.white,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: colors.gray[200],
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: colors.primary[600],
  },
  progressStepComplete: {
    backgroundColor: colors.primary[400],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 20,
  },
  selectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 10,
    gap: 14,
  },
  selectedCard: {
    borderColor: colors.primary[600],
    borderWidth: 2,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionInfo: {
    flex: 1,
  },
  selectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  selectionSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 2,
  },
  datePicker: {
    marginBottom: 24,
  },
  dateItem: {
    width: 64,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: colors.white,
    marginRight: 10,
  },
  dateItemSelected: {
    backgroundColor: colors.primary[600],
  },
  dateDayName: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  dateDay: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  dateMonth: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  dateTextSelected: {
    color: colors.white,
  },
  timeSlotsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  timeSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeSlot: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  timeSlotSelected: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  timeSlotText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
  },
  timeSlotTextSelected: {
    color: colors.white,
  },
  noSlotsText: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  summaryCard: {
    padding: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingTop: 14,
    marginTop: 6,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary[600],
  },
  bottomActions: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
});
