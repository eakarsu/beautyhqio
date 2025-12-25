import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Avatar, Badge, Button, LoadingSpinner } from '../../src/components/ui';
import { colors } from '../../src/utils/colors';
import { appointmentsService } from '../../src/services';
import { Appointment, AppointmentStatus } from '../../src/types';
import { formatDate, formatTime, getDuration, formatCurrency, formatPhone } from '../../src/utils/helpers';

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchAppointment = useCallback(async () => {
    if (!id) return;

    try {
      const response = await appointmentsService.getAppointment(id);
      if (response.data) {
        setAppointment(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch appointment:', error);
      Alert.alert('Error', 'Failed to load appointment details');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAppointment();
  }, [fetchAppointment]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchAppointment();
  };

  const updateStatus = async (newStatus: AppointmentStatus) => {
    if (!appointment) return;

    setIsUpdating(true);
    try {
      let response;
      switch (newStatus) {
        case 'CHECKED_IN':
          response = await appointmentsService.checkIn(appointment.id);
          break;
        case 'IN_SERVICE':
          response = await appointmentsService.startService(appointment.id);
          break;
        case 'COMPLETED':
          response = await appointmentsService.completeAppointment(appointment.id);
          break;
        case 'NO_SHOW':
          response = await appointmentsService.markNoShow(appointment.id);
          break;
        case 'CANCELLED':
          response = await appointmentsService.cancelAppointment(appointment.id);
          break;
        default:
          response = await appointmentsService.updateAppointment(appointment.id, { status: newStatus });
      }

      if (response.data) {
        setAppointment(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update appointment');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => updateStatus('CANCELLED'),
        },
      ]
    );
  };

  const getActionButtons = () => {
    if (!appointment) return null;

    switch (appointment.status) {
      case 'BOOKED':
        return (
          <View style={styles.actionButtons}>
            <Button
              title="Check In"
              onPress={() => updateStatus('CHECKED_IN')}
              loading={isUpdating}
              fullWidth
            />
            <Button
              title="Cancel"
              variant="outline"
              onPress={handleCancel}
              fullWidth
            />
          </View>
        );
      case 'CONFIRMED':
        return (
          <View style={styles.actionButtons}>
            <Button
              title="Check In"
              onPress={() => updateStatus('CHECKED_IN')}
              loading={isUpdating}
              fullWidth
            />
          </View>
        );
      case 'CHECKED_IN':
        return (
          <View style={styles.actionButtons}>
            <Button
              title="Start Service"
              onPress={() => updateStatus('IN_SERVICE')}
              loading={isUpdating}
              fullWidth
            />
            <Button
              title="No Show"
              variant="outline"
              onPress={() => updateStatus('NO_SHOW')}
              fullWidth
            />
          </View>
        );
      case 'IN_SERVICE':
        return (
          <View style={styles.actionButtons}>
            <Button
              title="Complete & Checkout"
              onPress={() => {
                updateStatus('COMPLETED');
                router.push(`/checkout?appointmentId=${appointment.id}`);
              }}
              loading={isUpdating}
              fullWidth
            />
          </View>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading appointment..." />;
  }

  if (!appointment) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Appointment not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Appointment',
          headerRight: () => (
            <TouchableOpacity style={styles.headerBtn}>
              <Ionicons name="ellipsis-horizontal" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Status Banner */}
          <View style={styles.statusBanner}>
            <Badge status={appointment.status} />
            <Text style={styles.appointmentDate}>
              {formatDate(appointment.startTime, 'EEEE, MMMM d, yyyy')}
            </Text>
            <Text style={styles.appointmentTime}>
              {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
            </Text>
          </View>

          {/* Client Card */}
          <Card variant="elevated" style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person" size={18} color={colors.primary[600]} />
              <Text style={styles.cardTitle}>Client</Text>
            </View>
            <TouchableOpacity
              style={styles.clientRow}
              onPress={() => router.push(`/client/${appointment.clientId}`)}
            >
              <Avatar
                source={appointment.client?.profileImage}
                firstName={appointment.client?.firstName || 'U'}
                lastName={appointment.client?.lastName}
                size="large"
              />
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>
                  {appointment.client?.firstName} {appointment.client?.lastName}
                </Text>
                {appointment.client?.phone && (
                  <Text style={styles.clientDetail}>
                    {formatPhone(appointment.client.phone)}
                  </Text>
                )}
                {appointment.client?.email && (
                  <Text style={styles.clientDetail} numberOfLines={1}>
                    {appointment.client.email}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            </TouchableOpacity>
          </Card>

          {/* Service Card */}
          <Card variant="elevated" style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="cut" size={18} color={colors.primary[600]} />
              <Text style={styles.cardTitle}>Service</Text>
            </View>
            <View style={styles.serviceDetails}>
              <View style={styles.serviceRow}>
                <Text style={styles.serviceName}>{appointment.service?.name}</Text>
                <Text style={styles.servicePrice}>
                  {formatCurrency(appointment.totalPrice)}
                </Text>
              </View>
              <View style={styles.serviceMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={16} color={colors.text.tertiary} />
                  <Text style={styles.metaText}>
                    {getDuration(appointment.startTime, appointment.endTime)}
                  </Text>
                </View>
                {appointment.staff && (
                  <View style={styles.metaItem}>
                    <Ionicons name="person-outline" size={16} color={colors.text.tertiary} />
                    <Text style={styles.metaText}>
                      {appointment.staff.firstName} {appointment.staff.lastName}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Card>

          {/* Notes Card */}
          {(appointment.notes || appointment.internalNotes) && (
            <Card variant="elevated" style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="document-text" size={18} color={colors.primary[600]} />
                <Text style={styles.cardTitle}>Notes</Text>
              </View>
              {appointment.notes && (
                <View style={styles.noteSection}>
                  <Text style={styles.noteLabel}>Client Notes</Text>
                  <Text style={styles.noteText}>{appointment.notes}</Text>
                </View>
              )}
              {appointment.internalNotes && (
                <View style={styles.noteSection}>
                  <Text style={styles.noteLabel}>Internal Notes</Text>
                  <Text style={styles.noteText}>{appointment.internalNotes}</Text>
                </View>
              )}
            </Card>
          )}

          {/* Payment Card */}
          <Card variant="elevated" style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="card" size={18} color={colors.primary[600]} />
              <Text style={styles.cardTitle}>Payment</Text>
            </View>
            <View style={styles.paymentDetails}>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Service</Text>
                <Text style={styles.paymentValue}>{formatCurrency(appointment.totalPrice)}</Text>
              </View>
              {appointment.depositPaid > 0 && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Deposit Paid</Text>
                  <Text style={[styles.paymentValue, { color: colors.success.main }]}>
                    -{formatCurrency(appointment.depositPaid)}
                  </Text>
                </View>
              )}
              <View style={[styles.paymentRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Balance Due</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(appointment.totalPrice - appointment.depositPaid)}
                </Text>
              </View>
            </View>
          </Card>
        </ScrollView>

        {/* Action Buttons */}
        {getActionButtons()}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  headerBtn: {
    padding: 8,
  },
  statusBanner: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: colors.white,
    marginHorizontal: -16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  appointmentDate: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 12,
  },
  appointmentTime: {
    fontSize: 15,
    color: colors.text.secondary,
    marginTop: 4,
  },
  card: {
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  clientDetail: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  serviceDetails: {},
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary[600],
  },
  serviceMeta: {
    flexDirection: 'row',
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  noteSection: {
    marginBottom: 12,
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.tertiary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  noteText: {
    fontSize: 15,
    color: colors.text.primary,
    lineHeight: 22,
  },
  paymentDetails: {},
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  paymentLabel: {
    fontSize: 15,
    color: colors.text.secondary,
  },
  paymentValue: {
    fontSize: 15,
    color: colors.text.primary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary[600],
  },
  actionButtons: {
    padding: 16,
    gap: 10,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  errorText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 40,
  },
});
