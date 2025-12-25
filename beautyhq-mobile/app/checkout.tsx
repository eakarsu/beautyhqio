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
import { Card, Button, Input, LoadingSpinner } from '../src/components/ui';
import { colors } from '../src/utils/colors';
import { appointmentsService, transactionsService } from '../src/services';
import { Appointment, PaymentMethod } from '../src/types';
import { formatCurrency } from '../src/utils/helpers';

interface LineItem {
  id: string;
  name: string;
  type: 'SERVICE' | 'PRODUCT';
  quantity: number;
  unitPrice: number;
  total: number;
}

const paymentMethods: { id: PaymentMethod; label: string; icon: string }[] = [
  { id: 'CARD', label: 'Card', icon: 'card' },
  { id: 'CASH', label: 'Cash', icon: 'cash' },
  { id: 'APPLE_PAY', label: 'Apple Pay', icon: 'logo-apple' },
  { id: 'GOOGLE_PAY', label: 'Google Pay', icon: 'logo-google' },
];

export default function CheckoutScreen() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId?: string }>();

  const [isLoading, setIsLoading] = useState(!!appointmentId);
  const [isProcessing, setIsProcessing] = useState(false);
  const [appointment, setAppointment] = useState<Appointment | null>(null);

  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('CARD');
  const [tipAmount, setTipAmount] = useState(0);
  const [customTip, setCustomTip] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  // Load appointment if ID provided
  useEffect(() => {
    if (appointmentId) {
      const loadAppointment = async () => {
        try {
          const response = await appointmentsService.getAppointment(appointmentId);
          if (response.data) {
            setAppointment(response.data);
            // Add service as line item
            if (response.data.service) {
              setLineItems([
                {
                  id: response.data.service.id,
                  name: response.data.service.name,
                  type: 'SERVICE',
                  quantity: 1,
                  unitPrice: response.data.totalPrice,
                  total: response.data.totalPrice,
                },
              ]);
            }
          }
        } catch (error) {
          console.error('Failed to load appointment:', error);
        } finally {
          setIsLoading(false);
        }
      };
      loadAppointment();
    }
  }, [appointmentId]);

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const taxRate = 0.08; // 8% tax
  const tax = subtotal * taxRate;
  const total = subtotal + tax + tipAmount - discountAmount;

  const tipOptions = [
    { label: '15%', value: Math.round(subtotal * 0.15 * 100) / 100 },
    { label: '20%', value: Math.round(subtotal * 0.2 * 100) / 100 },
    { label: '25%', value: Math.round(subtotal * 0.25 * 100) / 100 },
    { label: 'Custom', value: -1 },
  ];

  const handleTipSelect = (value: number) => {
    if (value === -1) {
      // Custom tip - use input
    } else {
      setTipAmount(value);
      setCustomTip('');
    }
  };

  const handleCustomTipChange = (text: string) => {
    setCustomTip(text);
    const amount = parseFloat(text) || 0;
    setTipAmount(amount);
  };

  const handlePayment = async () => {
    if (lineItems.length === 0) {
      Alert.alert('Error', 'Please add items to checkout');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await transactionsService.createTransaction({
        clientId: appointment?.clientId,
        staffId: appointment?.staffId,
        appointmentId: appointment?.id,
        items: lineItems.map((item) => ({
          type: item.type,
          itemId: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        paymentMethod: selectedPaymentMethod,
        tip: tipAmount,
        discount: discountAmount,
      });

      if (response.data) {
        Alert.alert('Success', 'Payment processed successfully!', [
          {
            text: 'Done',
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert('Error', response.error || 'Failed to process payment');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process payment');
    } finally {
      setIsProcessing(false);
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
          title: 'Checkout',
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Line Items */}
          <Card variant="elevated" style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="cart" size={18} color={colors.primary[600]} />
              <Text style={styles.cardTitle}>Items</Text>
              <TouchableOpacity style={styles.addBtn}>
                <Ionicons name="add" size={20} color={colors.primary[600]} />
              </TouchableOpacity>
            </View>

            {lineItems.length === 0 ? (
              <Text style={styles.emptyText}>No items added</Text>
            ) : (
              lineItems.map((item) => (
                <View key={item.id} style={styles.lineItem}>
                  <View style={styles.lineItemInfo}>
                    <Text style={styles.lineItemName}>{item.name}</Text>
                    <Text style={styles.lineItemMeta}>
                      {item.quantity} × {formatCurrency(item.unitPrice)}
                    </Text>
                  </View>
                  <Text style={styles.lineItemTotal}>{formatCurrency(item.total)}</Text>
                </View>
              ))
            )}
          </Card>

          {/* Tip Selection */}
          <Card variant="elevated" style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="heart" size={18} color={colors.primary[600]} />
              <Text style={styles.cardTitle}>Add Tip</Text>
            </View>

            <View style={styles.tipOptions}>
              {tipOptions.map((option) => {
                const isSelected =
                  option.value === -1
                    ? customTip !== ''
                    : tipAmount === option.value && customTip === '';
                return (
                  <TouchableOpacity
                    key={option.label}
                    style={[styles.tipOption, isSelected && styles.tipOptionSelected]}
                    onPress={() => handleTipSelect(option.value)}
                  >
                    <Text style={[styles.tipOptionText, isSelected && styles.tipOptionTextSelected]}>
                      {option.label}
                    </Text>
                    {option.value > 0 && (
                      <Text style={[styles.tipAmount, isSelected && styles.tipAmountSelected]}>
                        {formatCurrency(option.value)}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Input
              placeholder="Enter custom tip amount"
              value={customTip}
              onChangeText={handleCustomTipChange}
              keyboardType="decimal-pad"
              leftIcon={<Text style={styles.dollarSign}>$</Text>}
              containerStyle={{ marginBottom: 0, marginTop: 12 }}
            />
          </Card>

          {/* Payment Method */}
          <Card variant="elevated" style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="card" size={18} color={colors.primary[600]} />
              <Text style={styles.cardTitle}>Payment Method</Text>
            </View>

            <View style={styles.paymentMethods}>
              {paymentMethods.map((method) => {
                const isSelected = selectedPaymentMethod === method.id;
                return (
                  <TouchableOpacity
                    key={method.id}
                    style={[styles.paymentMethod, isSelected && styles.paymentMethodSelected]}
                    onPress={() => setSelectedPaymentMethod(method.id)}
                  >
                    <Ionicons
                      name={method.icon as any}
                      size={24}
                      color={isSelected ? colors.primary[600] : colors.gray[500]}
                    />
                    <Text
                      style={[
                        styles.paymentMethodText,
                        isSelected && styles.paymentMethodTextSelected,
                      ]}
                    >
                      {method.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          {/* Summary */}
          <Card variant="elevated" style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="receipt" size={18} color={colors.primary[600]} />
              <Text style={styles.cardTitle}>Summary</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax ({(taxRate * 100).toFixed(0)}%)</Text>
              <Text style={styles.summaryValue}>{formatCurrency(tax)}</Text>
            </View>
            {tipAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tip</Text>
                <Text style={styles.summaryValue}>{formatCurrency(tipAmount)}</Text>
              </View>
            )}
            {discountAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={[styles.summaryValue, { color: colors.success.main }]}>
                  -{formatCurrency(discountAmount)}
                </Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
            </View>
          </Card>
        </ScrollView>

        {/* Pay Button */}
        <View style={styles.bottomAction}>
          <Button
            title={`Pay ${formatCurrency(total)}`}
            onPress={handlePayment}
            loading={isProcessing}
            fullWidth
            size="large"
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
    padding: 16,
    paddingBottom: 24,
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
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: 16,
  },
  lineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  lineItemInfo: {
    flex: 1,
  },
  lineItemName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
  },
  lineItemMeta: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  lineItemTotal: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  tipOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  tipOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
  },
  tipOptionSelected: {
    backgroundColor: colors.primary[600],
  },
  tipOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  tipOptionTextSelected: {
    color: colors.white,
  },
  tipAmount: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  tipAmountSelected: {
    color: colors.primary[100],
  },
  dollarSign: {
    fontSize: 16,
    color: colors.gray[500],
    fontWeight: '500',
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  paymentMethod: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.gray[50],
    borderWidth: 1.5,
    borderColor: colors.gray[200],
  },
  paymentMethodSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[600],
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  paymentMethodTextSelected: {
    color: colors.primary[700],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 15,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: 15,
    color: colors.text.primary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingTop: 12,
    marginTop: 4,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary[600],
  },
  bottomAction: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
});
