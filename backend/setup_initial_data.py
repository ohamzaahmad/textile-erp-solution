"""
Initial setup script for TextileFlow ERP Backend
Run this after migrations to set up initial data
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'textileflow.settings')
django.setup()

from core.models import User
from accounts.models import Vendor, Customer
from inventory.models import ItemMaster

def setup_initial_data():
    """Create initial data for the system"""
    
    print("Creating initial data...")
    
    # Create a default admin user if not exists
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser(
            username='admin',
            password='admin123',
            name='Administrator',
            role='manager',
            email='admin@textileflow.com'
        )
        print("✓ Created admin user (username: admin, password: admin123)")
    
    # Create sample users
    if not User.objects.filter(username='manager').exists():
        User.objects.create_user(
            username='manager',
            password='manager123',
            name='Store Manager',
            role='manager'
        )
        print("✓ Created manager user (username: manager, password: manager123)")
    
    if not User.objects.filter(username='cashier').exists():
        User.objects.create_user(
            username='cashier',
            password='cashier123',
            name='Cashier',
            role='cashier'
        )
        print("✓ Created cashier user (username: cashier, password: cashier123)")
    
    # Create sample vendors
    if Vendor.objects.count() == 0:
        vendors_data = [
            {'name': 'Textile Mills Ltd', 'contact': '+1-555-0101', 'address': '123 Mill Street'},
            {'name': 'Fabric Suppliers Inc', 'contact': '+1-555-0102', 'address': '456 Fabric Avenue'},
            {'name': 'Cotton Traders', 'contact': '+1-555-0103', 'address': '789 Cotton Road'},
        ]
        for vendor_data in vendors_data:
            Vendor.objects.create(**vendor_data)
        print(f"✓ Created {len(vendors_data)} sample vendors")
    
    # Create sample customers
    if Customer.objects.count() == 0:
        customers_data = [
            {'name': 'ABC Garments', 'contact': '+1-555-0201', 'address': '111 Fashion Street'},
            {'name': 'XYZ Clothing Co', 'contact': '+1-555-0202', 'address': '222 Retail Road'},
            {'name': 'Fashion Boutique', 'contact': '+1-555-0203', 'address': '333 Style Avenue'},
        ]
        for customer_data in customers_data:
            Customer.objects.create(**customer_data)
        print(f"✓ Created {len(customers_data)} sample customers")
    
    # Create sample item master entries (Fabric Types)
    if ItemMaster.objects.count() == 0:
        items_data = [
            {'code': 'CT001', 'name': 'Cotton Twill', 'category': 'Cotton', 'standard_price': 120.00, 'description': 'Durable cotton twill fabric'},
            {'code': 'DN001', 'name': 'Denim Heavy', 'category': 'Cotton', 'standard_price': 350.00, 'description': 'Heavy-weight denim fabric'},
            {'code': 'SL001', 'name': 'Silk Smooth', 'category': 'Silk', 'standard_price': 850.00, 'description': 'Premium smooth silk fabric'},
            {'code': 'LN001', 'name': 'Linen Blend', 'category': 'Natural', 'standard_price': 250.00, 'description': 'Natural linen blend'},
            {'code': 'PL001', 'name': 'Polyester Mesh', 'category': 'Synthetic', 'standard_price': 180.00, 'description': 'Breathable polyester mesh'},
            {'code': 'VL001', 'name': 'Velvet Soft', 'category': 'Luxury', 'standard_price': 650.00, 'description': 'Soft velvet fabric'},
            {'code': 'WL001', 'name': 'Wool Warm', 'category': 'Wool', 'standard_price': 480.00, 'description': 'Warm wool fabric'},
        ]
        for item_data in items_data:
            ItemMaster.objects.create(**item_data)
        print(f"✓ Created {len(items_data)} fabric types in item master")
    
    print("\nInitial setup completed successfully!")
    print("\nYou can now login with:")
    print("  Admin: username=admin, password=admin123")
    print("  Manager: username=manager, password=manager123")
    print("  Cashier: username=cashier, password=cashier123")

if __name__ == '__main__':
    setup_initial_data()
