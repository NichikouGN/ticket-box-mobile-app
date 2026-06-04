import React from 'react';
import { Redirect } from 'expo-router';

export default function EntryPoint() {
  // Phase 1: Redirect directly to the login screen.
  // Phase 2: Check SecureStore token version and user role to redirect appropriately.
  return <Redirect href="/(auth)/login" />;
}
