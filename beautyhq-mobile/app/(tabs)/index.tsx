import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Avatar, Badge, LoadingSpinner } from '../../src/components/ui';
import { colors } from '../../src/utils/colors';
import { useAuthStore } from '../../src/contexts/auth-store';
import { dashboardService, appointmentsService } from '../../src/services';
import { Appointment, DashboardStats } from '../../src/types';
import { formatTime, formatCurrency, getRelativeDay } from '../../src/utils/helpers';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, appointmentsRes] = await Promise.all([
        dashboardService.getDashboardStats(),
        appointmentsService.getUpcomingAppointments(5),
      ]);

      if (statsRes.data) {
        setStats(statsRes.data);
      }
      if (appointmentsRes.data) {
        setUpcomingAppointments(appointmentsRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading dashboard..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Good {getTimeOfDay()}, {user?.name?.split(' ')[0] || 'there'}!
            </Text>
            <Text style={styles.subGreeting}>Here's your salon overview</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24} color={colors.text.primary} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <Card variant="elevated" style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.primary[50] }]}>
              <Ionicons name="calendar" size={20} color={colors.primary[600]} />
            </View>
            <Text style={styles.statValue}>{stats?.todayAppointments || 0}</Text>
            <Text style={styles.statLabel}>Today's Appts</Text>
          </Card>

          <Card variant="elevated" style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.success.light }]}>
              <Ionicons name="cash" size={20} color={colors.success.dark} />
            </View>
            <Text style={styles.statValue}>
              {formatCurrency(stats?.todayRevenue || 0)}
            </Text>
            <Text style={styles.statLabel}>Today's Revenue</Text>
          </Card>

          <Card variant="elevated" style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.secondary[50] }]}>
              <Ionicons name="trending-up" size={20} color={colors.secondary[600]} />
            </View>
            <Text style={styles.statValue}>
              {formatCurrency(stats?.weeklyRevenue || 0)}
            </Text>
            <Text style={styles.statLabel}>This Week</Text>
          </Card>

          <Card variant="elevated" style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.info.light }]}>
              <Ionicons name="person-add" size={20} color={colors.info.dark} />
            </View>
            <Text style={styles.statValue}>{stats?.newClients || 0}</Text>
            <Text style={styles.statLabel}>New Clients</Text>
          </Card>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => router.push('/booking/new')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.primary[100] }]}>
                <Ionicons name="add" size={24} color={colors.primary[600]} />
              </View>
              <Text style={styles.quickActionLabel}>New Booking</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => router.push('/(tabs)/clients')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.secondary[100] }]}>
                <Ionicons name="person-add" size={24} color={colors.secondary[600]} />
              </View>
              <Text style={styles.quickActionLabel}>Add Client</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => router.push('/checkout')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.success.light }]}>
                <Ionicons name="card" size={24} color={colors.success.dark} />
              </View>
              <Text style={styles.quickActionLabel}>Checkout</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => router.push('/(tabs)/appointments')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.info.light }]}>
                <Ionicons name="calendar" size={24} color={colors.info.dark} />
              </View>
              <Text style={styles.quickActionLabel}>Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upcoming Appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/appointments')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {upcomingAppointments.length === 0 ? (
            <Card variant="outlined" style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={32} color={colors.gray[400]} />
              <Text style={styles.emptyText}>No upcoming appointments</Text>
            </Card>
          ) : (
            upcomingAppointments.map((appointment) => (
              <TouchableOpacity
                key={appointment.id}
                onPress={() => router.push(`/appointment/${appointment.id}`)}
              >
                <Card variant="outlined" style={styles.appointmentCard}>
                  <View style={styles.appointmentTime}>
                    <Text style={styles.timeText}>
                      {formatTime(appointment.startTime)}
                    </Text>
                    <Text style={styles.dateText}>
                      {getRelativeDay(appointment.startTime)}
                    </Text>
                  </View>
                  <View style={styles.appointmentInfo}>
                    <View style={styles.clientRow}>
                      <Avatar
                        source={appointment.client?.profileImage}
                        firstName={appointment.client?.firstName || 'U'}
                        lastName={appointment.client?.lastName}
                        size="small"
                      />
                      <View style={styles.clientInfo}>
                        <Text style={styles.clientName}>
                          {appointment.client?.firstName} {appointment.client?.lastName}
                        </Text>
                        <Text style={styles.serviceName}>
                          {appointment.service?.name}
                        </Text>
                      </View>
                    </View>
                    <Badge status={appointment.status} size="small" />
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  subGreeting: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error.main,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    padding: 16,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary[600],
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionBtn: {
    alignItems: 'center',
    width: '23%',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  appointmentCard: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 8,
  },
  appointmentTime: {
    width: 60,
    borderRightWidth: 1,
    borderRightColor: colors.gray[200],
    paddingRight: 12,
    marginRight: 12,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  dateText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  appointmentInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  serviceName: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 8,
  },
});
