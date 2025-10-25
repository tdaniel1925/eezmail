import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #FF4C5A',
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF4C5A',
    marginBottom: 5,
  },
  invoiceNumber: {
    fontSize: 14,
    color: '#64748b',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1e293b',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  label: {
    color: '#64748b',
  },
  value: {
    fontWeight: 'bold',
    color: '#1e293b',
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 10,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottom: '1 solid #e2e8f0',
  },
  col1: { width: '50%' },
  col2: { width: '15%', textAlign: 'right' },
  col3: { width: '15%', textAlign: 'right' },
  col4: { width: '20%', textAlign: 'right' },
  total: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 5,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF4C5A',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 10,
    borderTop: '1 solid #e2e8f0',
    paddingTop: 10,
  },
});

interface InvoiceTemplateProps {
  invoiceNumber: string;
  date: Date;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  total: number;
  billingDetails: {
    name: string;
    email: string;
    address?: string;
  };
}

const InvoiceTemplate = ({
  invoiceNumber,
  date,
  items,
  total,
  billingDetails,
}: InvoiceTemplateProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>INVOICE</Text>
        <Text style={styles.invoiceNumber}>{invoiceNumber}</Text>
      </View>

      {/* Billing Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bill To:</Text>
        <Text style={{ marginBottom: 3 }}>{billingDetails.name}</Text>
        <Text style={{ color: '#64748b' }}>{billingDetails.email}</Text>
        {billingDetails.address && (
          <Text style={{ color: '#64748b', marginTop: 3 }}>
            {billingDetails.address}
          </Text>
        )}
      </View>

      {/* Invoice Info */}
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Invoice Date:</Text>
          <Text style={styles.value}>{date.toLocaleDateString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Status:</Text>
          <Text style={{ ...styles.value, color: '#10b981' }}>PAID</Text>
        </View>
      </View>

      {/* Items Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.col1}>Description</Text>
          <Text style={styles.col2}>Qty</Text>
          <Text style={styles.col3}>Price</Text>
          <Text style={styles.col4}>Total</Text>
        </View>
        {items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.col1}>{item.description}</Text>
            <Text style={styles.col2}>{item.quantity}</Text>
            <Text style={styles.col3}>${item.unitPrice.toFixed(2)}</Text>
            <Text style={styles.col4}>${item.total.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Total */}
      <View style={styles.total}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Thank you for your business!</Text>
        <Text>For questions, contact support@yourcompany.com</Text>
      </View>
    </Page>
  </Document>
);

export default InvoiceTemplate;

