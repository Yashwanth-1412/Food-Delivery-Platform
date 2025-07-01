from flask import Blueprint, request, jsonify
from services.payment_service import CashfreeService
from middleware.auth import require_auth, get_current_user_id
from services.customer_service import customer_service
import uuid,os
from datetime import datetime, timedelta
import requests 

payment_bp = Blueprint('payment', __name__, url_prefix='/api/payment')


class CashfreeService:
    def __init__(self):
        self.app_id = os.getenv("CASHFREE_APP_ID")
        self.secret_key = os.getenv("CASHFREE_SECRET_KEY")
        self.api_version = "2025-01-01"
        self.base_url = "https://sandbox.cashfree.com/pg"
    
    def create_payment_link(self, link_amount, customer_details, order_info=None):
        try:
            headers = {
                'Content-Type': 'application/json',
                'x-api-version': self.api_version,
                'x-client-id': self.app_id,
                'x-client-secret': self.secret_key
            }
            
            link_id = f"link_{uuid.uuid4().hex[:20]}"
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
                    'return_url': f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/payment/success",
                    'notify_url': f"{os.getenv('BACKEND_URL', 'http://localhost:5000')}/api/payment/webhook",
                    'upi_intent': True
                },
                'link_expiry_time': expiry_time,
                'link_auto_reminders': True,
                'link_notify': {
                    'send_email': False,
                    'send_sms': False
                }
            }
            
            response = requests.post(
                f"{self.base_url}/links",
                json=payload,
                headers=headers
            )
            
            cf_response = response.json()
            print(f"Cashfree response: {cf_response}")  # Debug log
            
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

payment_service = CashfreeService()

@payment_bp.route('/create-link', methods=['POST'])
@require_auth
def create_payment_link():
    """Create payment link for order"""
    try:
        data = request.get_json()
        print(f"Received payment link request: {data}")  # Debug log
        
        current_user = get_current_user_id()
        customer = customer_service.get_customer_profile(current_user)
        
        # Validate required fields
        if 'link_amount' not in data or 'customer_phone' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required fields: link_amount, customer_phone'
            }), 400
        
        # Prepare customer details
        customer_details = {
            'customer_name': customer['name'] or 'Customer',
            'customer_email': customer['email'] or 'customer@example.com',
            'customer_phone': data['customer_phone']
        }
        
        # Prepare order info
        order_info = {
            'purpose': f"Food Order - {data.get('restaurant_name', 'Restaurant')}",
            'restaurant_id': data.get('restaurant_id')
        }
        
        # Create payment link
        result = payment_service.create_payment_link(
            link_amount=float(data['link_amount']),
            customer_details=customer_details,
            order_info=order_info
        )
        
        print(f"Payment link result: {result}")  # Debug log
        return jsonify(result)
        
    except Exception as e:
        print(f"Error in create_payment_link: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@payment_bp.route('/check-link-status/<cf_link_id>', methods=['GET'])
@require_auth
def get_payment_link_status(self, cf_link_id):
    """Get actual payment link status from Cashfree"""
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
                'payments': cf_response.get('payments', [])
            }
        else:
            return {
                'success': False,
                'error': cf_response.get('message', 'Failed to get status')
            }
    except Exception as e:
        return {'success': False, 'error': str(e)}