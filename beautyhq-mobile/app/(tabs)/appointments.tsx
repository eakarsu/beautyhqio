import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Avatar, Badge, LoadingSpinner, EmptyState, Button } from '../../src/components/ui';
import { colors } from '../../src/utils/colors';
import { appointmentsService } from '../../src/services';
import { Appointment, AppointmentStatus } from '../../src/types';
import { formatTime, formatDate, getDuration, getRelativeDay } from '../../src/utils/helpers';

const statusFilters: { label: string; value: AppointmentStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Booked', value: 'BOOKED' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Checked In', value: 'CHECKED_IN' },
  { label: 'In Service', value: 'IN_SERVICE' },
  { label: 'Completed', value: 'COMPLETED' },
];

export default function AppointmentsScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<AppointmentStatus | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const fetchAppointments = useCallback(async () => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const status = selectedFilter === 'all' ? undefined : selectedFilter;

      const response = await appointmentsService.getAppointments({
        date: dateStr,
        status,
      });

      if (response.data) {
        setAppointments(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedDate, selectedFilter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchAppointments();
  };

  const navigateDate = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  const renderAppointment = ({ item }: { item: Appointment }) => (
    <TouchableOpacity onPress={() => router.push(`/appointment/${item.id}`)}>
      <Card variant="elevated" style={styles.appointmentCard}>
        <View style={styles.timeColumn}>
          <Text style={styles.startTime}>{formatTime(item.startTime)}</Text>
          <Text style={styles.endTime}>{formatTime(item.endTime)}</Text>
          <Text style={styles.duration}>
            {getDuration(item.startTime, item.endTime)}
          </Text>
        </View>

        <View style={styles.appointmentContent}>
          <View style={styles.appointmentHeader}>
            <View style={styles.clientInfo}>
              <Avatar
                source={item.client?.profileImage}
                firstName={item.client?.firstName || 'U'}
                lastName={item.client?.lastName}
                size="medium"
              />
              <View style={styles.clientText}>
                <Text style={styles.clientName}>
                  {item.client?.firstName} {item.client?.lastName}
                </Text>
                <Text style={styles.clientPhone}>{item.client?.phone || 'No phone'}</Text>
              </View>
            </View>
            <Badge status={item.status} size="small" />
          </View>

          <View style={styles.serviceRow}>
            <Ionicons name="cut-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.serviceName}>{item.service?.name}</Text>
            <Text style={styles.servicePrice}>${item.totalPrice}</Text>
          </View>

          {item.staff && (
            <View style={styles.staffRow}>
              <Ionicons name="person-outline" size={14} color={colors.text.tertiary} />
              <Text style={styles.staffName}>
                with {item.staff.firstName} {item.staff.lastName}
              </Text>
            </View>
          )}

          {item.notes && (
            <View style={styles.notesRow}>
              <Ionicons name="document-text-outline" size={14} color={colors.text.tertiary} />
              <Text style={styles.notesText} numberOfLines={1}>
                {item.notes}
              </Text>
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Date Navigator */}
      <View style={styles.dateNav}>
        <TouchableOpacity
          style={styles.dateNavBtn}
          onPress={() => navigateDate(-1)}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.dateDisplay}>
          <Text style={styles.dateText}>{getRelativeDay(selectedDate)}</Text>
          <Text style={styles.fullDateText}>{formatDate(selectedDate, 'MMMM d, yyyy')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateNavBtn}
          onPress={() => navigateDate(1)}
        >
          <Ionicons name="chevron-forward" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Status Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={statusFilters}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedFilter === item.value && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter(item.value)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === item.value && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Appointments List */}
      {isLoading ? (
        <LoadingSpinner fullScreen message="Loading appointments..." />
      ) : appointments.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="No Appointments"
          description="There are no appointments scheduled for this day."
          actionLabel="New Booking"
          onAction={() => router.push('/booking/new')}
        />
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          renderItem={renderAppointment}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/booking/new')}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  dateNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDisplay: {
    alignItems: 'center',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  fullDateText: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  filtersContainer: {
    backgroundColor: colors.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  filtersList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primary[600],
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  filterTextActive: {
    color: colors.white,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  appointmentCard: {
    flexDirection: 'row',
    padding: 0,
    marginBottom: 12,
    overflow: 'hidden',
  },
  timeColumn: {
    width: 70,
    padding: 12,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  startTime: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary[700],
  },
  endTime: {
    fontSize: 12,
    color: colors.primary[500],
    marginTop: 2,
  },
  duration: {
    fontSize: 11,
    color: colors.primary[400],
    marginTop: 4,
  },
  appointmentContent: {
    flex: 1,
    padding: 12,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clientText: {
    flex: 1,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  clientPhone: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 1,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  serviceName: {
    flex: 1,
    fontSize: 14,
    color: colors.text.secondary,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  staffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  staffName: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notesText: {
    flex: 1,
    fontSize: 12,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
