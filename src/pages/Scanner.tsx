import React, { useState } from 'react';
import { useInventory } from '@/contexts/InventoryContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  ScanLine, 
  Plus, 
  Minus, 
  Package,
  Loader2
} from 'lucide-react';

const Scanner = () => {
  const { products, batches, getProductByBarcode, getTotalStock, scanIn, scanOut } = useInventory();
  const [barcode, setBarcode] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [mode, setMode] = useState<'in' | 'out'>('in');
  const [isScanning, setIsScanning] = useState(false);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    const product = getProductByBarcode(barcode.trim());
    if (product) {
      setSelectedProduct(product.id);
      setBarcode('');
      toast.success(`Found: ${product.name}`);
    } else {
      toast.error('Product not found');
    }
  };

  const productBatches = batches.filter(b => b.product_id === selectedProduct);
  const selectedProductData = products.find(p => p.id === selectedProduct);
  const selectedBatchData = batches.find(b => b.id === selectedBatch);

  const handleScan = async () => {
    if (!selectedProduct || !selectedBatch || quantity < 1) {
      toast.error('Please select product, batch, and quantity');
      return;
    }

    setIsScanning(true);
    try {
      if (mode === 'in') {
        await scanIn(selectedProduct, selectedBatch, quantity);
      } else {
        await scanOut(selectedProduct, selectedBatch, quantity);
      }
      setQuantity(1);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-heading">Scanner</h1>
          <p className="text-muted-foreground mt-1">
            Scan items in or out of inventory
          </p>
        </div>

        {/* Mode Toggle */}
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Button
                variant={mode === 'in' ? 'default' : 'outline'}
                className={mode === 'in' ? 'flex-1 gradient-primary' : 'flex-1'}
                onClick={() => setMode('in')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Scan In
              </Button>
              <Button
                variant={mode === 'out' ? 'default' : 'outline'}
                className={mode === 'out' ? 'flex-1 gradient-accent' : 'flex-1'}
                onClick={() => setMode('out')}
              >
                <Minus className="w-4 h-4 mr-2" />
                Scan Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Barcode Scanner */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-primary" />
              Barcode Lookup
            </CardTitle>
            <CardDescription>
              Enter a barcode to find the product
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBarcodeSubmit} className="flex gap-3">
              <Input
                placeholder="Enter barcode..."
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="flex-1 font-mono"
              />
              <Button type="submit" variant="secondary">
                Lookup
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Product Selection */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Select Product
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={selectedProduct} onValueChange={(v) => {
                setSelectedProduct(v);
                setSelectedBatch('');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{product.name}</span>
                        <Badge variant="secondary" className="ml-2">
                          {getTotalStock(product.id)} in stock
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProduct && (
              <div className="space-y-2">
                <Label>Batch</Label>
                <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {productBatches.map(batch => (
                      <SelectItem key={batch.id} value={batch.id}>
                        <div className="flex items-center gap-2">
                          <span>{batch.batch_code}</span>
                          <Badge variant="outline">{batch.quantity} units</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedBatch && (
              <div className="space-y-2">
                <Label>Quantity</Label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    max={mode === 'out' ? selectedBatchData?.quantity : undefined}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 text-center font-mono text-lg"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Button */}
        {selectedBatch && (
          <Button
            size="lg"
            className={`w-full text-lg py-6 ${mode === 'in' ? 'gradient-primary' : 'gradient-accent'}`}
            onClick={handleScan}
            disabled={isScanning}
          >
            {isScanning ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : mode === 'in' ? (
              <Plus className="w-5 h-5 mr-2" />
            ) : (
              <Minus className="w-5 h-5 mr-2" />
            )}
            {mode === 'in' ? 'Scan In' : 'Scan Out'} {quantity} unit{quantity !== 1 ? 's' : ''}
          </Button>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Scanner;
