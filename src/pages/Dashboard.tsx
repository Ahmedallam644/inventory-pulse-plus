import React from 'react';
import { useInventory } from '@/contexts/InventoryContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  Activity,
  Boxes,
  DollarSign
} from 'lucide-react';
import { format, isWithinInterval, addDays } from 'date-fns';

const Dashboard = () => {
  const { products, batches, auditLogs, loading } = useInventory();

  // Calculate stats
  const totalProducts = products.length;
  const totalBatches = batches.length;
  const totalStock = batches.reduce((sum, b) => sum + b.quantity, 0);
  const totalValue = products.reduce((sum, p) => {
    const productStock = batches
      .filter(b => b.product_id === p.id)
      .reduce((s, b) => s + b.quantity, 0);
    return sum + (productStock * p.price);
  }, 0);

  // Items expiring within 7 days
  const now = new Date();
  const expiringBatches = batches.filter(batch => {
    const expiryDate = new Date(batch.expiry_date);
    return isWithinInterval(expiryDate, { start: now, end: addDays(now, 7) });
  });

  // Recent activity
  const recentActivity = auditLogs.slice(0, 5);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'SCAN_IN': return 'bg-success/10 text-success';
      case 'SCAN_OUT': return 'bg-warning/10 text-warning';
      case 'ADJUST': return 'bg-primary/10 text-primary';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-heading">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Real-time inventory overview
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Products
              </CardTitle>
              <Package className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalProducts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalBatches} batches tracked
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Stock
              </CardTitle>
              <Boxes className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalStock.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                units across all products
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Stock Value
              </CardTitle>
              <DollarSign className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                total inventory value
              </p>
            </CardContent>
          </Card>

          <Card className={`border-border/50 ${expiringBatches.length > 0 ? 'ring-2 ring-warning/50' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Expiring Soon
              </CardTitle>
              <AlertTriangle className={`w-4 h-4 ${expiringBatches.length > 0 ? 'text-warning' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{expiringBatches.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                batches expire in 7 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expiring Items */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Expiring Soon
              </CardTitle>
              <CardDescription>
                Batches expiring within the next 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {expiringBatches.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No items expiring soon
                </p>
              ) : (
                <div className="space-y-3">
                  {expiringBatches.slice(0, 5).map(batch => {
                    const product = products.find(p => p.id === batch.product_id);
                    return (
                      <div 
                        key={batch.id} 
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div>
                          <p className="font-medium">{product?.name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">
                            Batch: {batch.batch_code}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                            {format(new Date(batch.expiry_date), 'MMM d')}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {batch.quantity} units
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest inventory actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No recent activity
                </p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map(log => (
                    <div 
                      key={log.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Badge className={getActionColor(log.action)}>
                          {log.action.replace('_', ' ')}
                        </Badge>
                        <div>
                          <p className="font-medium text-sm">
                            {(log.details as { product_name?: string })?.product_name || 'Product'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            by {log.user_email}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), 'HH:mm')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
