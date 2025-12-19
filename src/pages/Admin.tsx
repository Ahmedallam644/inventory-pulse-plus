import React from 'react';
import { useInventory } from '@/contexts/InventoryContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ShieldCheck, 
  Download,
  DollarSign,
  AlertTriangle,
  Activity,
  FileSpreadsheet
} from 'lucide-react';
import { format, isWithinInterval, addDays } from 'date-fns';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

const Admin = () => {
  const { products, batches, auditLogs } = useInventory();

  // Calculate stats
  const totalValue = products.reduce((sum, p) => {
    const productStock = batches
      .filter(b => b.product_id === p.id)
      .reduce((s, b) => s + b.quantity, 0);
    return sum + (productStock * p.price);
  }, 0);

  const now = new Date();
  const expiringBatches = batches.filter(batch => {
    const expiryDate = new Date(batch.expiry_date);
    return isWithinInterval(expiryDate, { start: now, end: addDays(now, 7) });
  });

  const recentActivity = auditLogs.slice(0, 10);

  // Export functions
  const exportInventoryReport = () => {
    try {
      const data = products.map(product => {
        const productBatches = batches.filter(b => b.product_id === product.id);
        const totalQty = productBatches.reduce((sum, b) => sum + b.quantity, 0);
        const earliestExpiry = productBatches.length > 0
          ? productBatches.reduce((earliest, b) => 
              new Date(b.expiry_date) < new Date(earliest) ? b.expiry_date : earliest,
              productBatches[0].expiry_date
            )
          : 'N/A';

        return {
          'Product Name': product.name,
          'SKU': product.sku,
          'Unit Price': product.price,
          'Total Qty': totalQty,
          'Total Value': totalQty * product.price,
          'Earliest Expiry': earliestExpiry !== 'N/A' ? format(new Date(earliestExpiry), 'yyyy-MM-dd') : 'N/A'
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory Report');
      XLSX.writeFile(wb, `inventory-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      toast.success('Inventory report exported');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const exportAuditLog = () => {
    try {
      const data = auditLogs.map(log => {
        const details = log.details as Record<string, unknown>;
        return {
          'Time': format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
          'User': log.user_email,
          'Action': log.action,
          'Product': details?.product_name || 'N/A',
          'Qty Change': log.action === 'SCAN_IN' 
            ? `+${details?.quantity_added || 0}` 
            : log.action === 'SCAN_OUT' 
            ? `-${details?.quantity_removed || 0}`
            : `${details?.old_quantity || 0} → ${details?.new_quantity || 0}`,
          'Notes': details?.reason || ''
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Audit Log');
      XLSX.writeFile(wb, `audit-log-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      toast.success('Audit log exported');
    } catch (error) {
      toast.error('Failed to export audit log');
    }
  };

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-primary" />
              Admin Panel
            </h1>
            <p className="text-muted-foreground mt-1">
              Reports, exports, and system overview
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Stock Value
              </CardTitle>
              <DollarSign className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card className={`border-border/50 ${expiringBatches.length > 0 ? 'ring-2 ring-warning/50' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Expiring Soon (7 days)
              </CardTitle>
              <AlertTriangle className={`w-4 h-4 ${expiringBatches.length > 0 ? 'text-warning' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{expiringBatches.length}</div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Recent Actions
              </CardTitle>
              <Activity className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{auditLogs.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Export Buttons */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              Export Reports
            </CardTitle>
            <CardDescription>
              Download Excel reports for inventory and audit logs
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button onClick={exportInventoryReport} className="gradient-primary">
              <Download className="w-4 h-4 mr-2" />
              Full Inventory Report
            </Button>
            <Button onClick={exportAuditLog} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Audit Log Export
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest staff actions and inventory changes
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivity.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      No activity recorded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  recentActivity.map(log => {
                    const details = log.details as Record<string, unknown>;
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(log.created_at), 'MMM d, HH:mm')}
                        </TableCell>
                        <TableCell className="text-sm">{log.user_email}</TableCell>
                        <TableCell>
                          <Badge className={getActionColor(log.action)}>
                            {log.action.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{details?.product_name as string || 'N/A'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.action === 'SCAN_IN' && `+${details?.quantity_added} units`}
                          {log.action === 'SCAN_OUT' && `-${details?.quantity_removed} units`}
                          {log.action === 'ADJUST' && `${details?.old_quantity} → ${details?.new_quantity}`}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Admin;
