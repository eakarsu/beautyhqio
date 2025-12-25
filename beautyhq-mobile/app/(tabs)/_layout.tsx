import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/utils/colors';

type TabIconName = 'home' | 'calendar' | 'people' | 'cart' | 'settings';

const tabIcons: Record<TabIconName, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  home: { active: 'home', inactive: 'home-outline' },
  calendar: { active: 'calendar', inactive: 'calendar-outline' },
  people: { active: 'people', inactive: 'people-outline' },
  cart: { active: 'cart', inactive: 'cart-outline' },
  settings: { active: 'settings', inactive: 'settings-outline' },
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.gray[400],
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.gray[100],
          paddingTop: 8,
          paddingBottom: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: colors.white,
        },
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? tabIcons.home.active : tabIcons.home.inactive}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appointments',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? tabIcons.calendar.active : tabIcons.calendar.inactive}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clients',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? tabIcons.people.active : tabIcons.people.inactive}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="pos"
        options={{
          title: 'POS',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? tabIcons.cart.active : tabIcons.cart.inactive}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? tabIcons.settings.active : tabIcons.settings.inactive}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
