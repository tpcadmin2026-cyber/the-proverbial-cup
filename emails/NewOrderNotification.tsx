import { Column, Hr, Link, Row, Text } from '@react-email/components'
import * as React from 'react'
import { EmailBase, styles } from './EmailBase'

interface OrderItem {
  name: string
  quantity: number
  price: string  // formatted, e.g. "4.99"
}

interface NewOrderNotificationProps {
  orderNumber: string
  customerName?: string
  customerEmail: string
  items: OrderItem[]
  total: string
  adminUrl: string
  siteName?: string
  footerText?: string
  logoUrl?: string
}

const ink  = '#1a0a00'
const gold = '#8b6914'

export function NewOrderNotification({
  orderNumber,
  customerName,
  customerEmail,
  items,
  total,
  adminUrl,
  siteName,
  footerText,
  logoUrl,
}: NewOrderNotificationProps) {
  return (
    <EmailBase
      previewText={`New order #${orderNumber} — ${total} from ${customerEmail}`}
      logoUrl={logoUrl}
      siteName={siteName}
      footerText={footerText}
    >
      <Text style={styles.heading}>New Order Received</Text>
      <Text style={styles.subheading}>— A Customer Has Made a Purchase —</Text>

      <Text style={styles.label}>Order Number</Text>
      <Text style={{ ...styles.value, fontSize: 18, letterSpacing: 1 }}>#{orderNumber}</Text>

      <Text style={styles.label}>Customer</Text>
      <Text style={styles.value}>{customerName ? `${customerName} · ${customerEmail}` : customerEmail}</Text>

      <Hr style={{ ...styles.divider, margin: '16px 0' }} />

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
          <Text style={{ color: ink, fontSize: 16, fontWeight: 'bold', margin: '4px 0' }}>Total</Text>
        </Column>
        <Column style={{ width: '20%', textAlign: 'right' as const }}>
          <Text style={{ color: ink, fontSize: 16, fontWeight: 'bold', margin: '4px 0' }}>{total}</Text>
        </Column>
      </Row>

      <Link href={adminUrl} style={styles.button}>View order in admin</Link>
    </EmailBase>
  )
}

export default NewOrderNotification
