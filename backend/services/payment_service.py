# backend/services/payment_service.py - Payment Links Implementation
import requests
import uuid
from datetime import datetime, timedelta

class CashfreeService:
    def __init__(self):
        self.app_id = "TEST106859960160a23d509cd5b5fd4069958601"
        self.secret_key = "cfsk_ma_test_08664407457fdd369d5eeb1aa17c5783_a0d69e13"
        self.api_version = "2025-01-01"
        self.base_url = "https://sandbox.cashfree.com/pg"
    
    def create_payment_link(self, link_amount, customer_details, order_info=None):
        """Create Cashfree payment link"""
        try:
            headers = {
                'Content-Type': 'application/json',
                'x-api-version': self.api_version,
                'x-client-id': self.app_id,
                'x-client-secret': self.secret_key
            }
            
            # Generate unique link_id
            link_id = f"link_{uuid.uuid4().hex[:20]}"
            
            # Set expiry time (24 hours from now)
            expiry_time = (datetime.utcnow() + timedelta(hours=24)).strftime('%Y-%m-%dT%H:%M:%S+05:30')
            
            payload = {
                'link_id': link_id,
                'link_amount': link_amount,
                'link_currency': 'INR',
                'link_purpose': order_info.get('purpose', 'Food Order Payment') if order_info else 'Food Order Payment',
                'customer_details': {
                    'customer_name': customer_details.get('customer_name', 'Customer'),
                    'customer_email': customer_details.get('customer_email', 'customer@example.com'),
                    'customer_phone': customer_details['customer_phone']
                },
                'link_meta': {
                    'return_url': 'http://localhost:3000/payment/success',  # Your frontend URL
                    'notify_url': 'http://localhost:5000/api/payment/webhook',  # Your webhook URL
                    'upi_intent': True
                },
                'link_expiry_time': expiry_time,
                'link_auto_reminders': True,
                'link_notify': {
                    'send_email': False,
                    'send_sms': False
                },
                'link_notes': {
                    'order_type': 'food_delivery',
                    'restaurant_id': order_info.get('restaurant_id') if order_info else None
                }
            }
            
            # Call Cashfree API
            response = requests.post(
                f"{self.base_url}/links",
                json=payload,
                headers=headers
            )
            
            cf_response = response.json()
            
            if response.status_code == 200 and 'cf_link_id' in cf_response:
                return {
                    'success': True,
                    'cf_link_id': cf_response['cf_link_id'],
                    'link_id': cf_response['link_id'],
                    'link_url': cf_response['link_url'],
                    'link_qrcode': cf_response.get('link_qrcode'),
                    'link_status': cf_response['link_status'],
                    'link_amount': cf_response['link_amount'],
                    'link_expiry_time': cf_response['link_expiry_time']
                }
            else:
                return {
                    'success': False,
                    'error': cf_response.get('message', 'Failed to create payment link')
                }
                
        except Exception as e:
            print(f"Error creating payment link: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_payment_link_status(self, cf_link_id):
        """Get payment link status"""
        try:
            headers = {
                'Content-Type': 'application/json',
                'x-api-version': self.api_version,
                'x-client-id': self.app_id,
                'x-client-secret': self.secret_key
            }
            
            response = requests.get(
                f"{self.base_url}/links/{cf_link_id}",
                headers=headers
            )
            
            cf_response = response.json()
            
            if response.status_code == 200:
                return {
                    'success': True,
                    'link_status': cf_response.get('link_status'),
                    'link_amount_paid': cf_response.get('link_amount_paid', 0),
                    'link_amount': cf_response.get('link_amount'),
                    'payments': cf_response.get('payments', [])
                }
            else:
                return {
                    'success': False,
                    'error': cf_response.get('message', 'Failed to get payment link status')
                }
                
        except Exception as e:
            print(f"Error getting payment link status: {e}")
            return {
                'success': False,
                'error': str(e)
            }

payment_service = CashfreeService()
