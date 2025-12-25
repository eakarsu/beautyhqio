import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Avatar, Badge, Button, LoadingSpinner } from '../../src/components/ui';
import { colors } from '../../src/utils/colors';
import { clientsService } from '../../src/services';
import { Client, Appointment } from '../../src/types';
import { formatDate, formatCurrency, formatPhone, formatTime } from '../../src/utils/helpers';

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchClient = useCallback(async () => {
    if (!id) return;

    try {
      const [clientRes, appointmentsRes] = await Promise.all([
        clientsService.getClient(id),
        clientsService.getClientAppointments(id, { limit: 10 }),
      ]);

      if (clientRes.data) {
        setClient(clientRes.data);
      }
      if (appointmentsRes.data) {
        setAppointments(appointmentsRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch client:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchClient();
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading client..." />;
  }

  if (!client) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Client not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Client',
          headerRight: () => (
            <TouchableOpacity style={styles.headerBtn}>
              <Ionicons name="create-outline" size={24} color={colors.primary[600]} />
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
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <Avatar
              source={client.profileImage}
              firstName={client.firstName}
              lastName={client.lastName}
              size="xlarge"
            />
            <Text style={styles.clientName}>
              {client.firstName} {client.lastName}
            </Text>
            {client.lastVisit && (
              <Text style={styles.lastVisit}>
                Last visit: {formatDate(client.lastVisit)}
              </Text>
            )}

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              {client.phone && (
                <TouchableOpacity style={styles.quickAction}>
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.success.light }]}>
                    <Ionicons name="call" size={20} color={colors.success.dark} />
                  </View>
                  <Text style={styles.quickActionLabel}>Call</Text>
                </TouchableOpacity>
              )}
              {client.phone && (
                <TouchableOpacity style={styles.quickAction}>
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.info.light }]}>
                    <Ionicons name="chatbubble" size={20} color={colors.info.dark} />
                  </View>
                  <Text style={styles.quickActionLabel}>Text</Text>
                </TouchableOpacity>
              )}
              {client.email && (
                <TouchableOpacity style={styles.quickAction}>
                  <View style={[styles.quickActionIcon, { backgroundColor: colors.primary[100] }]}>
                    <Ionicons name="mail" size={20} color={colors.primary[600]} />
                  </View>
                  <Text style={styles.quickActionLabel}>Email</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => router.push(`/booking/new?clientId=${client.id}`)}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: colors.secondary[100] }]}>
                  <Ionicons name="calendar" size={20} color={colors.secondary[600]} />
                </View>
                <Text style={styles.quickActionLabel}>Book</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsRow}>
            <Card variant="elevated" style={styles.statCard}>
              <Text style={styles.statValue}>{client.visitCount}</Text>
              <Text style={styles.statLabel}>Visits</Text>
            </Card>
            <Card variant="elevated" style={styles.statCard}>
              <Text style={styles.statValue}>{formatCurrency(client.totalSpent)}</Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </Card>
            <Card variant="elevated" style={styles.statCard}>
              <Text style={styles.statValue}>{client.loyaltyPoints}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </Card>
          </View>

          {/* Contact Info */}
          <Card variant="elevated" style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person" size={18} color={colors.primary[600]} />
              <Text style={styles.cardTitle}>Contact Info</Text>
            </View>
            {client.phone && (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={18} color={colors.gray[500]} />
                <Text style={styles.infoText}>{formatPhone(client.phone)}</Text>
              </View>
            )}
            {client.email && (
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={18} color={colors.gray[500]} />
                <Text style={styles.infoText}>{client.email}</Text>
              </View>
            )}
            {client.dateOfBirth && (
              <View style={styles.infoRow}>
                <Ionicons name="gift-outline" size={18} color={colors.gray[500]} />
                <Text style={styles.infoText}>
                  Birthday: {formatDate(client.dateOfBirth, 'MMMM d')}
                </Text>
              </View>
            )}
          </Card>

          {/* Notes */}
          {client.notes && (
            <Card variant="elevated" style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="document-text" size={18} color={colors.primary[600]} />
                <Text style={styles.cardTitle}>Notes</Text>
              </View>
              <Text style={styles.notesText}>{client.notes}</Text>
            </Card>
          )}

          {/* Recent Appointments */}
          <Card variant="elevated" style={styles.card}>
            <View style={styles.cardHeaderWithAction}>
              <View style={styles.cardHeader}>
                <Ionicons name="calendar" size={18} color={colors.primary[600]} />
                <Text style={styles.cardTitle}>Appointments</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            {appointments.length === 0 ? (
              <Text style={styles.emptyText}>No appointments yet</Text>
            ) : (
              appointments.slice(0, 5).map((apt) => (
                <TouchableOpacity
                  key={apt.id}
                  style={styles.appointmentRow}
                  onPress={() => router.push(`/appointment/${apt.id}`)}
                >
                  <View style={styles.appointmentDate}>
                    <Text style={styles.appointmentDay}>
                      {formatDate(apt.startTime, 'd')}
                    </Text>
                    <Text style={styles.appointmentMonth}>
                      {formatDate(apt.startTime, 'MMM')}
                    </Text>
                  </View>
                  <View style={styles.appointmentInfo}>
                    <Text style={styles.appointmentService}>{apt.service?.name}</Text>
                    <Text style={styles.appointmentTime}>{formatTime(apt.startTime)}</Text>
                  </View>
                  <Badge status={apt.status} size="small" />
                </TouchableOpacity>
              ))
            )}
          </Card>
        </ScrollView>

        {/* Book Button */}
        <View style={styles.bottomAction}>
          <Button
            title="Book Appointment"
            onPress={() => router.push(`/booking/new?clientId=${client.id}`)}
            fullWidth
            size="large"
            leftIcon={<Ionicons name="add" size={20} color={colors.white} />}
          />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  headerBtn: {
    padding: 8,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  clientName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 16,
  },
  lastVisit: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 24,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary[600],
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardHeaderWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary[600],
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: colors.text.primary,
  },
  notesText: {
    fontSize: 15,
    color: colors.text.primary,
    lineHeight: 22,
  },
  appointmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  appointmentDate: {
    width: 44,
    alignItems: 'center',
    marginRight: 12,
  },
  appointmentDay: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  appointmentMonth: {
    fontSize: 12,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentService: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
  },
  appointmentTime: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  bottomAction: {
    padding: 16,
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
