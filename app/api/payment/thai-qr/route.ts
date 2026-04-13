import { NextRequest, NextResponse } from 'next/server'

// Thai QR Payment (PromptPay) Generator
// This generates a PromptPay QR code payload following the EMVCo standard

function generateCRC16(data: string): string {
  let crc = 0xFFFF
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021
      } else {
        crc <<= 1
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0')
}

function formatTLV(tag: string, value: string): string {
  const length = value.length.toString().padStart(2, '0')
  return `${tag}${length}${value}`
}

function generatePromptPayPayload(
  targetId: string,
  amount?: number,
  isPhoneNumber: boolean = true
): string {
  // Payload Format Indicator
  let payload = formatTLV('00', '01')
  
  // Point of Initiation Method (12 = dynamic QR with amount)
  if (amount) {
    payload += formatTLV('01', '12')
  } else {
    payload += formatTLV('01', '11')
  }
  
  // Merchant Account Information for PromptPay
  const aidPromptPay = 'A000000677010111'
  let merchantInfo = formatTLV('00', aidPromptPay)
  
  // Format target ID based on type
  if (isPhoneNumber) {
    // Phone number format: 0066 + number without leading 0
    const formattedPhone = '0066' + targetId.replace(/^0/, '')
    merchantInfo += formatTLV('01', formattedPhone)
  } else {
    // National ID or Tax ID
    merchantInfo += formatTLV('02', targetId)
  }
  
  payload += formatTLV('29', merchantInfo)
  
  // Transaction Currency (764 = THB)
  payload += formatTLV('53', '764')
  
  // Transaction Amount (if provided)
  if (amount) {
    payload += formatTLV('54', amount.toFixed(2))
  }
  
  // Country Code
  payload += formatTLV('58', 'TH')
  
  // CRC placeholder
  payload += '6304'
  
  // Calculate and append CRC
  const crc = generateCRC16(payload)
  payload = payload.slice(0, -4) + formatTLV('63', crc)
  
  return payload
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { plan, amount, orderId } = body

    // Merchant PromptPay ID (phone number or tax ID)
    // In production, this would come from environment variables
    const merchantId = process.env.PROMPTPAY_ID || '0812345678'
    const isPhoneNumber = !process.env.PROMPTPAY_IS_TAX_ID

    // Generate PromptPay payload
    const payload = generatePromptPayPayload(merchantId, amount, isPhoneNumber)

    // Generate QR code URL using a QR code API
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payload)}`

    return NextResponse.json({
      success: true,
      data: {
        qrCodeUrl,
        payload,
        orderId: orderId || `ORD-${Date.now()}`,
        plan,
        amount,
        currency: 'THB',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes expiry
        merchantName: 'BoardBuddies Co., Ltd.',
        instructions: [
          'Open your mobile banking app',
          'Select "Scan QR" or "PromptPay"',
          'Scan the QR code displayed',
          'Verify the amount and merchant name',
          'Confirm the payment',
        ],
      },
    })
  } catch (error) {
    console.error('Thai QR generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate payment QR' },
      { status: 500 }
    )
  }
}

// Webhook endpoint for payment confirmation (in production, this would be called by the payment gateway)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, transactionId, status } = body

    // In production, verify the webhook signature and update the database
    if (status === 'completed') {
      return NextResponse.json({
        success: true,
        message: 'Payment confirmed',
        data: {
          orderId,
          transactionId,
          status: 'completed',
          confirmedAt: new Date().toISOString(),
        },
      })
    }

    return NextResponse.json({
      success: false,
      message: 'Payment not completed',
      status,
    })
  } catch (error) {
    console.error('Payment confirmation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process payment confirmation' },
      { status: 500 }
    )
  }
}
