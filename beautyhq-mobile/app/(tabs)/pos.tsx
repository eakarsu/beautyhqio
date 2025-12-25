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
import { Card, Badge, LoadingSpinner, EmptyState, Button } from '../../src/components/ui';
import { colors } from '../../src/utils/colors';
import { transactionsService } from '../../src/services';
import { Transaction } from '../../src/types';
import { formatCurrency, formatTime, getPaymentMethodLabel } from '../../src/utils/helpers';

export default function POSScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dailySummary, setDailySummary] = useState<{
    totalSales: number;
    totalRefunds: number;
    netRevenue: number;
    transactionCount: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [transRes, summaryRes] = await Promise.all([
        transactionsService.getTodayTransactions(),
        transactionsService.getDailySummary(),
      ]);

      if (transRes.data) {
        setTransactions(transRes.data);
      }
      if (summaryRes.data) {
        setDailySummary(summaryRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch POS data:', error);
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

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'SALE':
        return 'cart';
      case 'REFUND':
        return 'return-down-back';
      case 'VOID':
        return 'close-circle';
      default:
        return 'swap-horizontal';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'SALE':
        return colors.success.main;
      case 'REFUND':
        return colors.warning.main;
      case 'VOID':
        return colors.error.main;
      default:
        return colors.gray[500];
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity onPress={() => router.push(`/transaction/${item.id}`)}>
      <Card variant="outlined" style={styles.transactionCard}>
        <View
          style={[
            styles.transactionIcon,
            { backgroundColor: `${getTransactionColor(item.type)}15` },
          ]}
        >
          <Ionicons
            name={getTransactionIcon(item.type) as any}
            size={20}
            color={getTransactionColor(item.type)}
          />
        </View>
        <View style={styles.transactionInfo}>
          <View style={styles.transactionHeader}>
            <Text style={styles.transactionType}>{item.type}</Text>
            <Text
              style={[
                styles.transactionAmount,
                { color: item.type === 'REFUND' ? colors.error.main : colors.text.primary },
              ]}
            >
              {item.type === 'REFUND' ? '-' : ''}{formatCurrency(item.total)}
            </Text>
          </View>
          <View style={styles.transactionMeta}>
            <Text style={styles.metaText}>
              {formatTime(item.createdAt)} • {getPaymentMethodLabel(item.paymentMethod)}
            </Text>
            {item.items.length > 0 && (
              <Text style={styles.itemCount}>
                {item.items.length} item{item.items.length !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.gray[400]} />
      </Card>
    </TouchableOpacity>
  );

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading transactions..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Card variant="elevated" style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Today's Sales</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(dailySummary?.totalSales || 0)}
            </Text>
          </Card>
          <Card variant="elevated" style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Refunds</Text>
            <Text style={[styles.summaryValue, { color: colors.error.main }]}>
              {formatCurrency(dailySummary?.totalRefunds || 0)}
            </Text>
          </Card>
        </View>
        <Card variant="elevated" style={styles.netRevenueCard}>
          <View style={styles.netRevenueContent}>
            <View>
              <Text style={styles.netRevenueLabel}>Net Revenue</Text>
              <Text style={styles.netRevenueValue}>
                {formatCurrency(dailySummary?.netRevenue || 0)}
              </Text>
            </View>
            <View style={styles.transactionCount}>
              <Text style={styles.countValue}>{dailySummary?.transactionCount || 0}</Text>
              <Text style={styles.countLabel}>Transactions</Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Button
          title="New Sale"
          onPress={() => router.push('/checkout')}
          leftIcon={<Ionicons name="cart" size={18} color={colors.white} />}
          style={styles.newSaleBtn}
        />
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="refresh" size={20} color={colors.primary[600]} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="receipt-outline" size={20} color={colors.primary[600]} />
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      <View style={styles.transactionsSection}>
        <Text style={styles.sectionTitle}>Today's Transactions</Text>

        {transactions.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="No Transactions"
            description="Start ringing up sales to see them here."
            actionLabel="New Sale"
            onAction={() => router.push('/checkout')}
          />
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id}
            renderItem={renderTransaction}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  summaryContainer: {
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
  },
  netRevenueCard: {
    padding: 16,
  },
  netRevenueContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netRevenueLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  netRevenueValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.success.dark,
  },
  transactionCount: {
    alignItems: 'center',
    paddingLeft: 20,
    borderLeftWidth: 1,
    borderLeftColor: colors.gray[200],
  },
  countValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary[600],
  },
  countLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  newSaleBtn: {
    flex: 1,
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionsSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    textTransform: 'capitalize',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  itemCount: {
    fontSize: 12,
    color: colors.text.secondary,
    backgroundColor: colors.gray[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
