# backend/routes/agent.py
from flask import Blueprint, request, jsonify
from middleware.auth import get_current_user_id, require_role
from models.roles import UserRole
from services.agent_service import agent_service

agent_bp = Blueprint('agent', __name__, url_prefix='/api/agent')

# ===== AVAILABLE ORDERS =====

@agent_bp.route('/available-orders', methods=['GET'])
@require_role(UserRole.AGENT, UserRole.ADMIN)
def get_available_orders():
    """Get orders available for pickup by agents"""
    try:
        # Get query parameters
        radius = request.args.get('radius', 10, type=int)  # km radius
        limit = request.args.get('limit', 20, type=int)
        
        orders = agent_service.get_available_orders(radius, limit)
        
        return jsonify({
            'success': True,
            'data': orders,
            'count': len(orders)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@agent_bp.route('/orders/<order_id>/accept', methods=['POST'])
@require_role(UserRole.AGENT, UserRole.ADMIN)
def accept_order(order_id):
    """Accept an order for delivery"""
    try:
        agent_id = get_current_user_id()
        
        # Get estimated pickup time from request
        data = request.get_json() or {}
        estimated_pickup = data.get('estimated_pickup_minutes', 15)
        
        order = agent_service.accept_order(agent_id, order_id, estimated_pickup)
        
        return jsonify({
            'success': True,
            'message': 'Order accepted successfully',
            'data': order
        })
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ===== ACTIVE DELIVERIES =====

@agent_bp.route('/active-orders', methods=['GET'])
@require_role(UserRole.AGENT, UserRole.ADMIN)
def get_active_orders():
    """Get agent's active delivery orders"""
    try:
        agent_id = get_current_user_id()
        
        orders = agent_service.get_agent_active_orders(agent_id)
        
        return jsonify({
            'success': True,
            'data': orders,
            'count': len(orders)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@agent_bp.route('/orders/<order_id>/status', methods=['PUT'])
@require_role(UserRole.AGENT, UserRole.ADMIN)
def update_delivery_status(order_id):
    """Update delivery status"""
    try:
        agent_id = get_current_user_id()
        data = request.get_json()
        
        if not data or 'status' not in data:
            return jsonify({
                'success': False,
                'error': 'Status is required'
            }), 400
        
        # Validate status
        valid_statuses = ['picked_up', 'on_way', 'delivered']
        if data['status'] not in valid_statuses:
            return jsonify({
                'success': False,
                'error': f'Invalid status. Must be one of: {valid_statuses}'
            }), 400
        
        # Optional location data
        location = data.get('location')
        
        order = agent_service.update_delivery_status(
            agent_id, 
            order_id, 
            data['status'], 
            location
        )
        
        return jsonify({
            'success': True,
            'message': f'Order status updated to {data["status"]}',
            'data': order
        })
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ===== DELIVERY HISTORY & EARNINGS =====

@agent_bp.route('/delivery-history', methods=['GET'])
@require_role(UserRole.AGENT, UserRole.ADMIN)
def get_delivery_history():
    """Get agent's delivery history"""
    try:
        agent_id = get_current_user_id()
        
        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        limit = request.args.get('limit', 50, type=int)
        
        history = agent_service.get_delivery_history(
            agent_id, 
            start_date, 
            end_date, 
            limit
        )
        
        return jsonify({
            'success': True,
            'data': history
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@agent_bp.route('/earnings', methods=['GET'])
@require_role(UserRole.AGENT, UserRole.ADMIN)
def get_earnings():
    """Get agent's earnings statistics"""
    try:
        agent_id = get_current_user_id()
        
        # Get time period
        period = request.args.get('period', 'today')  # today, week, month
        
        earnings = agent_service.get_earnings_stats(agent_id, period)
        
        return jsonify({
            'success': True,
            'data': earnings
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ===== AGENT PROFILE & STATUS =====

@agent_bp.route('/profile', methods=['GET'])
@require_role(UserRole.AGENT, UserRole.ADMIN)
def get_agent_profile():
    """Get agent profile information"""
    try:
        agent_id = get_current_user_id()
        
        profile = agent_service.get_agent_profile(agent_id)
        
        return jsonify({
            'success': True,
            'data': profile
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@agent_bp.route('/profile', methods=['PUT'])
@require_role(UserRole.AGENT, UserRole.ADMIN)
def update_agent_profile():
    """Update agent profile"""
    try:
        agent_id = get_current_user_id()
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        profile = agent_service.update_agent_profile(agent_id, data)
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully',
            'data': profile
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@agent_bp.route('/status', methods=['PUT'])
@require_role(UserRole.AGENT, UserRole.ADMIN)
def update_agent_status():
    """Update agent availability status"""
    try:
        agent_id = get_current_user_id()
        data = request.get_json()
        
        if not data or 'status' not in data:
            return jsonify({
                'success': False,
                'error': 'Status is required'
            }), 400
        
        # Validate status
        valid_statuses = ['available', 'busy', 'offline']
        if data['status'] not in valid_statuses:
            return jsonify({
                'success': False,
                'error': f'Invalid status. Must be one of: {valid_statuses}'
            }), 400
        
        # Optional location data
        location = data.get('location')
        
        result = agent_service.update_agent_status(
            agent_id, 
            data['status'], 
            location
        )
        
        return jsonify({
            'success': True,
            'message': f'Status updated to {data["status"]}',
            'data': result
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500