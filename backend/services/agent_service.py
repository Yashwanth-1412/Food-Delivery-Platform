# backend/services/agent_service.py
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from config.firebase import db
from firebase_admin import firestore

class AgentService:
    def __init__(self):
        self.db = db

    # ===== AVAILABLE ORDERS =====
    
    def get_available_orders(self, radius: int = 10, limit: int = 20) -> List[Dict[str, Any]]:
        """Get orders available for pickup by agents"""
        try:
            # Get orders that are ready for pickup (restaurant prepared, no agent assigned)
            orders_ref = self.db.collection('orders')
            query = orders_ref.where('status', '==', 'ready').where('agent_id', '==', None).limit(limit)
            
            available_orders = []
            for doc in query.stream():
                order_data = doc.to_dict()
                order_data['id'] = doc.id
                
                # Get restaurant details
                restaurant_data = self._get_restaurant_details(order_data.get('restaurant_id'))
                order_data['restaurant'] = restaurant_data
                
                # Calculate estimated delivery fee
                order_data['delivery_fee'] = self._calculate_delivery_fee(order_data)
                
                available_orders.append(order_data)
            
            return available_orders
        except Exception as e:
            raise Exception(f"Error getting available orders: {str(e)}")

    def accept_order(self, agent_id: str, order_id: str, estimated_pickup_minutes: int = 15) -> Dict[str, Any]:
        """Accept an order for delivery"""
        try:
            order_ref = self.db.collection('orders').document(order_id)
            order_doc = order_ref.get()
            
            if not order_doc.exists:
                raise ValueError("Order not found")
            
            order_data = order_doc.to_dict()
            
            # Check if order is still available
            if order_data.get('status') != 'ready' or order_data.get('agent_id'):
                raise ValueError("Order is no longer available")
            
            # Update order with agent assignment
            now = datetime.utcnow()
            estimated_pickup = now + timedelta(minutes=estimated_pickup_minutes)
            
            update_data = {
                'agent_id': agent_id,
                'status': 'assigned_to_agent',
                'assigned_at': now,
                'estimated_pickup_time': estimated_pickup,
                'updated_at': now
            }
            
            order_ref.update(update_data)
            
            # Update agent status to busy
            self._update_agent_status_internal(agent_id, 'busy')
            
            # Return updated order
            updated_order = order_data.copy()
            updated_order.update(update_data)
            updated_order['id'] = order_id
            
            return updated_order
        except Exception as e:
            raise Exception(f"Error accepting order: {str(e)}")

    # ===== ACTIVE DELIVERIES =====
    
    def get_agent_active_orders(self, agent_id: str) -> List[Dict[str, Any]]:
        """Get agent's active delivery orders"""
        try:
            orders_ref = self.db.collection('orders')
            query = orders_ref.where('agent_id', '==', agent_id).where('status', 'in', 
                ['assigned_to_agent', 'picked_up', 'on_way'])
            
            active_orders = []
            for doc in query.stream():
                order_data = doc.to_dict()
                order_data['id'] = doc.id
                
                # Get restaurant and customer details
                order_data['restaurant'] = self._get_restaurant_details(order_data.get('restaurant_id'))
                order_data['customer'] = self._get_customer_details(order_data.get('customer_id'))
                
                active_orders.append(order_data)
            
            # Sort by assigned time (oldest first)
            active_orders.sort(key=lambda x: x.get('assigned_at', datetime.min))
            
            return active_orders
        except Exception as e:
            raise Exception(f"Error getting active orders: {str(e)}")

    def update_delivery_status(self, agent_id: str, order_id: str, status: str, location: Optional[Dict] = None) -> Dict[str, Any]:
        """Update delivery status"""
        try:
            order_ref = self.db.collection('orders').document(order_id)
            order_doc = order_ref.get()
            
            if not order_doc.exists:
                raise ValueError("Order not found")
            
            order_data = order_doc.to_dict()
            
            # Verify agent owns this order
            if order_data.get('agent_id') != agent_id:
                raise ValueError("You are not assigned to this order")
            
            # Validate status progression
            current_status = order_data.get('status')
            if not self._is_valid_status_transition(current_status, status):
                raise ValueError(f"Invalid status transition from {current_status} to {status}")
            
            # Update order
            now = datetime.utcnow()
            update_data = {
                'status': status,
                'updated_at': now
            }
            
            # Add status-specific timestamps
            if status == 'picked_up':
                update_data['picked_up_at'] = now
            elif status == 'on_way':
                update_data['on_way_at'] = now
            elif status == 'delivered':
                update_data['delivered_at'] = now
                # Calculate delivery fee and add to agent earnings
                self._process_delivery_completion(agent_id, order_data)
                # Set agent back to available
                self._update_agent_status_internal(agent_id, 'available')
            
            # Add location if provided
            if location:
                update_data['current_location'] = location
                update_data['location_updated_at'] = now
            
            order_ref.update(update_data)
            
            # Return updated order
            updated_order = order_data.copy()
            updated_order.update(update_data)
            updated_order['id'] = order_id
            
            return updated_order
        except Exception as e:
            raise Exception(f"Error updating delivery status: {str(e)}")

    # ===== DELIVERY HISTORY & EARNINGS =====
    
    def get_delivery_history(self, agent_id: str, start_date: Optional[str] = None, 
                           end_date: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """Get agent's delivery history"""
        try:
            orders_ref = self.db.collection('orders')
            
            # Start with basic query - agent_id and status
            query = orders_ref.where('agent_id', '==', agent_id).where('status', '==', 'delivered')
            
            # Don't add date filters to avoid index issues - we'll filter in memory if needed
            query = query.limit(limit * 2)  # Get more records to filter later
            
            history = []
            for doc in query.stream():
                order_data = doc.to_dict()
                order_data['id'] = doc.id
                
                # Manual date filtering if needed
                delivered_at = order_data.get('delivered_at')
                if delivered_at:
                    # Convert string to datetime if needed
                    if isinstance(delivered_at, str):
                        try:
                            delivered_at = datetime.fromisoformat(delivered_at.replace('Z', '+00:00'))
                        except:
                            continue
                    
                    # Apply date filters manually
                    if start_date:
                        try:
                            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                            if delivered_at < start_dt:
                                continue
                        except:
                            pass
                    
                    if end_date:
                        try:
                            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                            if delivered_at > end_dt:
                                continue
                        except:
                            pass
                
                # Get restaurant details
                order_data['restaurant'] = self._get_restaurant_details(order_data.get('restaurant_id'))
                
                history.append(order_data)
            
            # Sort by delivered_at (newest first) and limit
            history.sort(key=lambda x: x.get('delivered_at', datetime.min), reverse=True)
            return history[:limit]
            
        except Exception as e:
            print(f"Error getting delivery history: {str(e)}")
            # Return mock data for now
            return self._get_mock_delivery_history()

    def _get_mock_delivery_history(self) -> List[Dict[str, Any]]:
        """Return mock delivery history for development"""
        return [
            {
                'id': 'mock_1',
                'restaurant': {'name': 'Pizza Palace', 'address': '123 Main St'},
                'customer_name': 'John Doe',
                'delivery_address': '456 Oak Ave',
                'total': 25.50,
                'delivery_fee': 4.50,
                'tip_amount': 3.00,
                'delivered_at': datetime.utcnow() - timedelta(hours=2),
                'distance': '2.1 km'
            },
            {
                'id': 'mock_2',
                'restaurant': {'name': 'Burger Barn', 'address': '789 First St'},
                'customer_name': 'Jane Smith',
                'delivery_address': '321 Pine St',
                'total': 18.75,
                'delivery_fee': 3.50,
                'tip_amount': 2.50,
                'delivered_at': datetime.utcnow() - timedelta(hours=4),
                'distance': '1.8 km'
            }
        ]

    def get_earnings_stats(self, agent_id: str, period: str = 'today') -> Dict[str, Any]:
        """Get agent's earnings statistics"""
        try:
            # Calculate date range
            now = datetime.utcnow()
            if period == 'today':
                start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            elif period == 'week':
                start_date = now - timedelta(days=7)
            elif period == 'month':
                start_date = now - timedelta(days=30)
            else:
                start_date = now - timedelta(days=1)
            
            # Get delivered orders for this agent (simplified query)
            orders_ref = self.db.collection('orders')
            query = orders_ref.where('agent_id', '==', agent_id).where('status', '==', 'delivered')
            
            total_deliveries = 0
            total_earnings = 0.0
            total_tips = 0.0
            
            for doc in query.stream():
                order_data = doc.to_dict()
                delivered_at = order_data.get('delivered_at')
                
                # Manual date filtering
                if delivered_at:
                    if isinstance(delivered_at, str):
                        try:
                            delivered_at = datetime.fromisoformat(delivered_at.replace('Z', '+00:00'))
                        except:
                            continue
                    
                    # Check if within period
                    if delivered_at >= start_date:
                        total_deliveries += 1
                        total_earnings += order_data.get('delivery_fee', 0.0)
                        total_tips += order_data.get('tip_amount', 0.0)
            
            avg_earnings_per_delivery = total_earnings / total_deliveries if total_deliveries > 0 else 0
            
            return {
                'period': period,
                'total_deliveries': total_deliveries,
                'total_earnings': round(total_earnings, 2),
                'total_tips': round(total_tips, 2),
                'total_income': round(total_earnings + total_tips, 2),
                'average_per_delivery': round(avg_earnings_per_delivery, 2)
            }
        except Exception as e:
            print(f"Error getting earnings stats: {str(e)}")
            # Return mock data for development
            return {
                'period': period,
                'total_deliveries': 2,
                'total_earnings': 8.00,
                'total_tips': 5.50,
                'total_income': 13.50,
                'average_per_delivery': 4.00
            }

    # ===== AGENT PROFILE & STATUS =====
    
    def get_agent_profile(self, agent_id: str) -> Dict[str, Any]:
        """Get agent profile information"""
        try:
            # Get user basic info
            users_ref = self.db.collection('users').document(agent_id)
            user_doc = users_ref.get()
            
            if not user_doc.exists:
                # Create a basic user profile if it doesn't exist
                basic_user_data = {
                    'name': '',
                    'email': '',
                    'phone': '',
                    'role': 'agent',
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }
                users_ref.set(basic_user_data)
                user_data = basic_user_data
            else:
                user_data = user_doc.to_dict()

            # Get agent-specific data
            agents_ref = self.db.collection('agents').document(agent_id)
            agent_doc = agents_ref.get()
            
            if not agent_doc.exists:
                # Create default agent profile
                default_agent_data = {
                    'vehicle_type': 'bike',
                    'license_plate': '',
                    'status': 'offline',
                    'current_location': None,
                    'total_deliveries': 0,
                    'total_earnings': 0.0,
                    'rating': 5.0,
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }
                agents_ref.set(default_agent_data)
                agent_data = default_agent_data
            else:
                agent_data = agent_doc.to_dict()

            # Combine data
            profile = {
                'id': agent_id,
                'name': user_data.get('name', ''),
                'email': user_data.get('email', ''),
                'phone': user_data.get('phone', ''),
                'vehicle_type': agent_data.get('vehicle_type', 'bike'),
                'license_plate': agent_data.get('license_plate', ''),
                'status': agent_data.get('status', 'offline'),
                'current_location': agent_data.get('current_location'),
                'total_deliveries': agent_data.get('total_deliveries', 0),
                'total_earnings': agent_data.get('total_earnings', 0.0),
                'rating': agent_data.get('rating', 5.0),
                'created_at': user_data.get('created_at')
            }
            
            return profile
        except Exception as e:
            raise Exception(f"Error getting agent profile: {str(e)}")

    def update_agent_profile(self, agent_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update agent profile"""
        try:
            # Update user data
            user_updates = {}
            if 'name' in data:
                user_updates['name'] = data['name']
            if 'phone' in data:
                user_updates['phone'] = data['phone']
            if 'email' in data:
                user_updates['email'] = data['email']
            
            if user_updates:
                user_updates['updated_at'] = datetime.utcnow()
                # Use set with merge=True to create document if it doesn't exist
                self.db.collection('users').document(agent_id).set(user_updates, merge=True)
            
            # Update agent-specific data
            agent_updates = {}
            if 'vehicle_type' in data:
                agent_updates['vehicle_type'] = data['vehicle_type']
            if 'license_plate' in data:
                agent_updates['license_plate'] = data['license_plate']
            
            if agent_updates:
                agent_updates['updated_at'] = datetime.utcnow()
                # Use set with merge=True to create document if it doesn't exist
                self.db.collection('agents').document(agent_id).set(agent_updates, merge=True)
            
            # Return updated profile
            return self.get_agent_profile(agent_id)
        except Exception as e:
            raise Exception(f"Error updating agent profile: {str(e)}")

    def update_agent_status(self, agent_id: str, status: str, location: Optional[Dict] = None) -> Dict[str, Any]:
        """Update agent availability status"""
        try:
            return self._update_agent_status_internal(agent_id, status, location)
        except Exception as e:
            raise Exception(f"Error updating agent status: {str(e)}")

    # ===== HELPER METHODS =====
    
    def _update_agent_status_internal(self, agent_id: str, status: str, location: Optional[Dict] = None) -> Dict[str, Any]:
        """Internal method to update agent status"""
        update_data = {
            'status': status,
            'updated_at': datetime.utcnow()
        }
        
        if location:
            update_data['current_location'] = location
            update_data['location_updated_at'] = datetime.utcnow()
        
        self.db.collection('agents').document(agent_id).set(update_data, merge=True)
        
        return update_data

    def _get_restaurant_details(self, restaurant_id: str) -> Dict[str, Any]:
        """Get restaurant details"""
        try:
            restaurant_ref = self.db.collection('restaurants').document(restaurant_id)
            restaurant_doc = restaurant_ref.get()
            
            if restaurant_doc.exists:
                return restaurant_doc.to_dict()
            return {'name': 'Unknown Restaurant'}
        except:
            return {'name': 'Unknown Restaurant'}

    def _get_customer_details(self, customer_id: str) -> Dict[str, Any]:
        """Get customer details"""
        try:
            user_ref = self.db.collection('users').document(customer_id)
            user_doc = user_ref.get()
            
            if user_doc.exists:
                user_data = user_doc.to_dict()
                return {
                    'name': user_data.get('name', 'Customer'),
                    'phone': user_data.get('phone', '')
                }
            return {'name': 'Customer', 'phone': ''}
        except:
            return {'name': 'Customer', 'phone': ''}

    def _calculate_delivery_fee(self, order_data: Dict[str, Any]) -> float:
        """Calculate delivery fee for an order"""
        # Simple fee calculation - you can make this more sophisticated
        base_fee = 3.00
        distance_multiplier = 0.50  # per km
        
        # For now, return base fee - you can integrate with maps API for real distance
        return base_fee

    def _is_valid_status_transition(self, current_status: str, new_status: str) -> bool:
        """Validate if status transition is allowed"""
        valid_transitions = {
            'assigned_to_agent': ['picked_up'],
            'picked_up': ['on_way'],
            'on_way': ['delivered']
        }
        
        return new_status in valid_transitions.get(current_status, [])

    def _process_delivery_completion(self, agent_id: str, order_data: Dict[str, Any]):
        """Process delivery completion - update agent stats and earnings"""
        try:
            agent_ref = self.db.collection('agents').document(agent_id)
            
            # Update agent stats
            agent_doc = agent_ref.get()
            current_stats = agent_doc.to_dict() if agent_doc.exists else {}
            
            total_deliveries = current_stats.get('total_deliveries', 0) + 1
            total_earnings = current_stats.get('total_earnings', 0.0) + order_data.get('delivery_fee', 0.0)
            
            agent_ref.set({
                'total_deliveries': total_deliveries,
                'total_earnings': total_earnings,
                'last_delivery_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }, merge=True)
            
        except Exception as e:
            print(f"Error processing delivery completion: {str(e)}")

# Create singleton instance
agent_service = AgentService()