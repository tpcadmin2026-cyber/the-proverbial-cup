import { Column, Hr, Row, Text } from '@react-email/components'
import * as React from 'react'
import { EmailBase, styles } from './EmailBase'

interface OrderItem {
  name: string
  quantity: number
  price: string  // formatted, e.g. "$4.99"
}

interface OrderConfirmationProps {
  name?: string
  orderNumber: string
  items: OrderItem[]
  subtotal: string
  total: string
  siteName?: string
  footerText?: string
  logoUrl?: string
}

const ink  = '#1a0a00'
const gold = '#8b6914'

export function OrderConfirmation({
  name,
  orderNumber,
  items,
  subtotal,
  total,
  siteName,
  footerText,
  logoUrl,
}: OrderConfirmationProps) {
  return (
    <EmailBase
      previewText={`Order #${orderNumber} confirmed — thank you for your custom.`}
      logoUrl={logoUrl}
      siteName={siteName}
      footerText={footerText}
    >
      <Text style={styles.heading}>Order Confirmed</Text>
      <Text style={styles.subheading}>— Receipt of Purchase —</Text>

      <Text style={styles.body}>
        {name ? `Dear ${name},` : 'Dear Customer,'}
      </Text>
      <Text style={styles.body}>
        We have received your order and are preparing it for despatch forthwith.
        A summary of your purchase is recorded below for your records.
      </Text>

      <Hr style={styles.divider} />

      <Text style={styles.label}>Order Number</Text>
      <Text style={{ ...styles.value, fontSize: 18, letterSpacing: 1 }}>#{orderNumber}</Text>

      <Hr style={{ ...styles.divider, margin: '16px 0' }} />

      {/* Line items */}
      <Row style={{ borderBottom: `1px solid ${gold}`, paddingBottom: 6, marginBottom: 6 }}>
        <Column style={{ width: '60%' }}>
          <Text style={{ ...styles.label, margin: 0 }}>Item</Text>
        </Column>
        <Column style={{ width: '20%', textAlign: 'center' as const }}>
          <Text style={{ ...styles.label, margin: 0 }}>Qty</Text>
        </Column>
        <Column style={{ width: '20%', textAlign: 'right' as const }}>
          <Text style={{ ...styles.label, margin: 0 }}>Price</Text>
        </Column>
      </Row>

      {items.map((item, i) => (
        <Row key={i} style={{ paddingBottom: 8 }}>
          <Column style={{ width: '60%' }}>
            <Text style={{ color: ink, fontSize: 14, margin: 0 }}>{item.name}</Text>
          </Column>
          <Column style={{ width: '20%', textAlign: 'center' as const }}>
            <Text style={{ color: ink, fontSize: 14, margin: 0 }}>{item.quantity}</Text>
          </Column>
          <Column style={{ width: '20%', textAlign: 'right' as const }}>
            <Text style={{ color: ink, fontSize: 14, margin: 0 }}>{item.price}</Text>
          </Column>
        </Row>
      ))}

      <Hr style={{ ...styles.divider, margin: '8px 0' }} />

      <Row>
        <Column style={{ width: '80%', textAlign: 'right' as const }}>
          <Text style={{ ...styles.label, margin: '4px 0' }}>Subtotal</Text>
        </Column>
        <Column style={{ width: '20%', textAlign: 'right' as const }}>
          <Text style={{ color: ink, fontSize: 14, margin: '4px 0' }}>{subtotal}</Text>
        </Column>
      </Row>
      <Row>
        <Column style={{ width: '80%', textAlign: 'right' as const }}>
          <Text style={{ color: ink, fontSize: 16, fontWeight: 'bold', margin: '4px 0' }}>Total</Text>
        </Column>
        <Column style={{ width: '20%', textAlign: 'right' as const }}>
          <Text style={{ color: ink, fontSize: 16, fontWeight: 'bold', margin: '4px 0' }}>{total}</Text>
        </Column>
      </Row>

      <Hr style={styles.divider} />

      <Text style={styles.small}>
        Your goods will be dispatched within 1–3 working days. A separate despatch notification will follow when your order is on its way.
      </Text>
      <Text style={styles.small}>
        If you have questions about your order, please contact our editorial desk via the Help Desk on our website.
      </Text>
    </EmailBase>
  )
}

export default OrderConfirmation
