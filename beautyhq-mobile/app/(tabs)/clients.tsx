import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Avatar, LoadingSpinner, EmptyState } from '../../src/components/ui';
import { colors } from '../../src/utils/colors';
import { clientsService } from '../../src/services';
import { Client } from '../../src/types';
import { formatCurrency, formatDate, formatPhone } from '../../src/utils/helpers';

export default function ClientsScreen() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchClients = useCallback(async () => {
    try {
      const response = await clientsService.getClients({
        pageSize: 100,
        isActive: true,
      });

      if (response.data) {
        setClients(response.data.data || []);
        setFilteredClients(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredClients(clients);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = clients.filter(
        (client) =>
          client.firstName.toLowerCase().includes(query) ||
          client.lastName?.toLowerCase().includes(query) ||
          client.email?.toLowerCase().includes(query) ||
          client.phone?.includes(query)
      );
      setFilteredClients(filtered);
    }
  }, [searchQuery, clients]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchClients();
  };

  const renderClient = ({ item }: { item: Client }) => (
    <TouchableOpacity onPress={() => router.push(`/client/${item.id}`)}>
      <Card variant="elevated" style={styles.clientCard}>
        <Avatar
          source={item.profileImage}
          firstName={item.firstName}
          lastName={item.lastName}
          size="large"
        />
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>
            {item.firstName} {item.lastName}
          </Text>
          {item.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={14} color={colors.text.tertiary} />
              <Text style={styles.infoText}>{formatPhone(item.phone)}</Text>
            </View>
          )}
          {item.email && (
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={14} color={colors.text.tertiary} />
              <Text style={styles.infoText} numberOfLines={1}>
                {item.email}
              </Text>
            </View>
          )}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{item.visitCount}</Text>
              <Text style={styles.statLabel}>Visits</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatCurrency(item.totalSpent)}</Text>
              <Text style={styles.statLabel}>Spent</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{item.loyaltyPoints}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={colors.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clients..."
            placeholderTextColor={colors.gray[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Clients List */}
      {isLoading ? (
        <LoadingSpinner fullScreen message="Loading clients..." />
      ) : filteredClients.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title={searchQuery ? 'No Results' : 'No Clients'}
          description={
            searchQuery
              ? `No clients found matching "${searchQuery}"`
              : 'Add your first client to get started.'
          }
          actionLabel="Add Client"
          onAction={() => {
            // Navigate to add client
          }}
        />
      ) : (
        <FlatList
          data={filteredClients}
          keyExtractor={(item) => item.id}
          renderItem={renderClient}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.resultCount}>
              {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}
            </Text>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="person-add" size={24} color={colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text.primary,
  },
  resultCount: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    gap: 14,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: colors.text.secondary,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.gray[200],
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
