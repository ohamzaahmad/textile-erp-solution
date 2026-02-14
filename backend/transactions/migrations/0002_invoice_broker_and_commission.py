from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_broker'),
        ('transactions', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='invoice',
            name='commission_amount',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name='invoice',
            name='commission_type',
            field=models.CharField(blank=True, choices=[('Percentage', 'Percentage'), ('Fixed', 'Fixed Amount')], max_length=20),
        ),
        migrations.AddField(
            model_name='invoice',
            name='commission_value',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name='invoice',
            name='broker',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='invoices', to='accounts.broker'),
        ),
    ]
