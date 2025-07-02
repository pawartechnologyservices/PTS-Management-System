import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Receipt, Download, Eye, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { useAuth } from '../../hooks/useAuth';
import { generateSalarySlipPDF } from '../../utils/pdfGenerator';
import { toast } from '../ui/use-toast';

const EmployeeSalarySlips = () => {
  const { user } = useAuth();
  const [salarySlips, setSalarySlips] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedSlip, setSelectedSlip] = useState(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    const allSlips = JSON.parse(localStorage.getItem('salary_slips') || '[]');
    const userSlips = allSlips.filter(slip => slip.employeeId === user?.employeeId);
    setSalarySlips(userSlips);
  }, [user]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const downloadSlip = (slip) => {
    const slipContent = `
SALARY SLIP
===========

Employee: ${slip.employeeName}
Employee ID: ${slip.employeeId}
Month: ${months[slip.month]} ${slip.year}
Generated: ${new Date(slip.generatedAt).toLocaleDateString()}

EARNINGS:
Basic Salary: ${formatCurrency(slip.basicSalary)}
Allowances: ${formatCurrency(slip.allowances)}
Total Earnings: ${formatCurrency(slip.basicSalary + slip.allowances)}

DEDUCTIONS:
Tax & Other Deductions: ${formatCurrency(slip.deductions)}

NET SALARY: ${formatCurrency(slip.netSalary)}

This is a computer-generated salary slip.
    `;

    const blob = new Blob([slipContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salary-slip-${months[slip.month]}-${slip.year}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadSlipAsPDF = (slip) => {
    const pdfData = {
      employeeName: slip.employeeName,
      employeeId: slip.employeeId,
      month: months[slip.month],
      year: slip.year,
      basicSalary: slip.basicSalary,
      allowances: slip.allowances,
      deductions: slip.deductions,
      netSalary: slip.netSalary,
      generatedAt: slip.generatedAt,
      companyName: 'Your Company Name',
      companyAddress: 'Your Company Address'
    };
    
    generateSalarySlipPDF(pdfData);
    
    toast({
      title: "PDF Downloaded",
      description: `Salary slip PDF downloaded for ${months[slip.month]} ${slip.year}`
    });
  };

  const filteredSlips = salarySlips.filter(slip => slip.year === selectedYear);

  const getSalaryStats = () => {
    const currentYear = new Date().getFullYear();
    const currentYearSlips = salarySlips.filter(slip => slip.year === currentYear);
    
    const totalEarnings = currentYearSlips.reduce((sum, slip) => sum + slip.netSalary, 0);
    const avgSalary = currentYearSlips.length > 0 ? totalEarnings / currentYearSlips.length : 0;
    const highestSalary = currentYearSlips.length > 0 ? Math.max(...currentYearSlips.map(slip => slip.netSalary)) : 0;
    
    return { totalEarnings, avgSalary, highestSalary, slipsReceived: currentYearSlips.length };
  };

  const stats = getSalaryStats();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Salary Slips</h1>
          <p className="text-gray-600">View and download your salary slips</p>
        </div>
      </motion.div>

      {/* Salary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Earnings</p>
                  <p className="text-lg font-bold">{formatCurrency(stats.totalEarnings)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Average Salary</p>
                  <p className="text-lg font-bold">{formatCurrency(stats.avgSalary)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Highest Salary</p>
                  <p className="text-lg font-bold">{formatCurrency(stats.highestSalary)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Slips Received</p>
                  <p className="text-lg font-bold">{stats.slipsReceived}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Filter Salary Slips</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </motion.div>

      {/* Salary Slips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Salary Slips - {selectedYear} ({filteredSlips.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredSlips.map((slip, index) => (
                <motion.div
                  key={slip.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          {months[slip.month]} {slip.year}
                        </h3>
                        <Badge className={slip.status === 'sent' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}>
                          {slip.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <p className="font-medium">Basic Salary</p>
                          <p>{formatCurrency(slip.basicSalary)}</p>
                        </div>
                        <div>
                          <p className="font-medium">Allowances</p>
                          <p>{formatCurrency(slip.allowances)}</p>
                        </div>
                        <div>
                          <p className="font-medium">Deductions</p>
                          <p>{formatCurrency(slip.deductions)}</p>
                        </div>
                        <div>
                          <p className="font-medium">Net Salary</p>
                          <p className="text-green-600 font-semibold">{formatCurrency(slip.netSalary)}</p>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-500">
                        Generated: {new Date(slip.generatedAt).toLocaleDateString()}
                        {slip.sentAt && (
                          <> • Sent: {new Date(slip.sentAt).toLocaleDateString()}</>
                        )}
                      </p>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedSlip(slip)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadSlipAsPDF(slip)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        PDF
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => downloadSlip(slip)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Text
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
              {filteredSlips.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No salary slips found for {selectedYear}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Salary Slip Detail Modal */}
      {selectedSlip && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedSlip(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg p-6 max-w-md w-full max-h-96 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Salary Slip Details</h3>
              <Button size="sm" variant="outline" onClick={() => setSelectedSlip(null)}>
                ×
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="text-center border-b pb-4">
                <h4 className="font-semibold">{months[selectedSlip.month]} {selectedSlip.year}</h4>
                <p className="text-sm text-gray-600">{selectedSlip.employeeName}</p>
                <p className="text-sm text-gray-600">ID: {selectedSlip.employeeId}</p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">Earnings</h4>
                <div className="flex justify-between">
                  <span>Basic Salary:</span>
                  <span>{formatCurrency(selectedSlip.basicSalary)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Allowances:</span>
                  <span>{formatCurrency(selectedSlip.allowances)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total Earnings:</span>
                  <span>{formatCurrency(selectedSlip.basicSalary + selectedSlip.allowances)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-red-600">Deductions</h4>
                <div className="flex justify-between">
                  <span>Tax & Others:</span>
                  <span>{formatCurrency(selectedSlip.deductions)}</span>
                </div>
              </div>
              
              <div className="border-t pt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Net Salary:</span>
                  <span className="text-green-600">{formatCurrency(selectedSlip.netSalary)}</span>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button onClick={() => downloadSlipAsPDF(selectedSlip)} className="flex-1">
                  <Download className="h-3 w-3 mr-1" />
                  Download PDF
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default EmployeeSalarySlips;
