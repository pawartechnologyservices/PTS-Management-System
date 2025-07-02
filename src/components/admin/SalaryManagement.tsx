import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Download, Send, Upload, Users, FileText, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { toast } from '../ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import SalaryTemplateCreator from './SalaryTemplateCreator';
import { generateSalarySlipPDF } from '../../utils/pdfGenerator';

const SalaryManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [salarySlips, setSalarySlips] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const employeeData = JSON.parse(localStorage.getItem('hrms_users') || '[]');
    const activeEmployees = employeeData.filter(emp => emp.isActive && emp.role === 'employee');
    setEmployees(activeEmployees);

    const slips = JSON.parse(localStorage.getItem('salary_slips') || '[]');
    setSalarySlips(slips);
  }, []);

  const generateSalarySlip = (employee) => {
    const basicSalary = getBasicSalary(employee.designation);
    const allowances = basicSalary * 0.3;
    const deductions = basicSalary * 0.12;
    const netSalary = basicSalary + allowances - deductions;

    const salarySlip = {
      id: Date.now().toString(),
      employeeId: employee.employeeId,
      employeeName: employee.name,
      employeeEmail: employee.email,
      month: selectedMonth,
      year: selectedYear,
      basicSalary,
      allowances,
      deductions,
      netSalary,
      generatedAt: new Date().toISOString(),
      status: 'generated'
    };

    const updatedSlips = [...salarySlips, salarySlip];
    setSalarySlips(updatedSlips);
    localStorage.setItem('salary_slips', JSON.stringify(updatedSlips));

    toast({
      title: "Salary Slip Generated",
      description: `Salary slip generated for ${employee.name}`
    });
  };

  const sendSalarySlip = (slip) => {
    // In a real app, this would send email
    const updatedSlips = salarySlips.map(s => 
      s.id === slip.id ? { ...s, status: 'sent', sentAt: new Date().toISOString() } : s
    );
    
    setSalarySlips(updatedSlips);
    localStorage.setItem('salary_slips', JSON.stringify(updatedSlips));

    toast({
      title: "Salary Slip Sent",
      description: `Salary slip sent to ${slip.employeeName} via email`
    });
  };

  const getBasicSalary = (designation) => {
    const salaryMap = {
      'Software Developer': 60000,
      'Digital Marketing Executive': 35000,
      'Sales Executive': 30000,
      'Product Designer': 45000,
      'Web Developer': 50000,
      'Graphic Designer': 35000,
      'Manager': 80000,
      'Team Lead': 70000
    };
    return salaryMap[designation] || 40000;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
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
      description: `Salary slip PDF downloaded for ${slip.employeeName}`
    });
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentMonthSlips = salarySlips.filter(slip => 
    slip.month === selectedMonth && slip.year === selectedYear
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Salary Management</h1>
          <p className="text-gray-600">Generate and manage employee salary slips</p>
        </div>
      </motion.div>

      <Tabs defaultValue="manage" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Manage Salaries
          </TabsTrigger>
          <TabsTrigger value="template" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Create Template
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="space-y-6">
          {/* Month/Year Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Select Period</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month, index) => (
                        <SelectItem key={index} value={index.toString()}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Employee List for Salary Generation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Generate Salary Slips - {months[selectedMonth]} {selectedYear}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employees.map((employee, index) => {
                    const hasSlip = currentMonthSlips.some(slip => slip.employeeId === employee.employeeId);
                    const basicSalary = getBasicSalary(employee.designation);
                    
                    return (
                      <motion.div
                        key={employee.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{employee.name}</h3>
                            {hasSlip && <Badge className="bg-green-100 text-green-700">Generated</Badge>}
                          </div>
                          <p className="text-sm text-gray-600">{employee.employeeId} • {employee.designation}</p>
                          <p className="text-sm text-gray-600">Basic Salary: {formatCurrency(basicSalary)}</p>
                        </div>
                        <Button
                          onClick={() => generateSalarySlip(employee)}
                          disabled={hasSlip}
                          size="sm"
                        >
                          <CreditCard className="h-3 w-3 mr-1" />
                          {hasSlip ? 'Generated' : 'Generate'}
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Generated Salary Slips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Generated Salary Slips ({currentMonthSlips.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentMonthSlips.map((slip, index) => (
                    <motion.div
                      key={slip.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{slip.employeeName}</h3>
                          <Badge className={slip.status === 'sent' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}>
                            {slip.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{slip.employeeId}</p>
                        <p className="text-sm text-gray-600">Net Salary: {formatCurrency(slip.netSalary)}</p>
                        <p className="text-xs text-gray-500">
                          Generated: {new Date(slip.generatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
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
                          onClick={() => sendSalarySlip(slip)}
                          disabled={slip.status === 'sent'}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          {slip.status === 'sent' ? 'Sent' : 'Send'}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                  {currentMonthSlips.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No salary slips generated for this period
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="template">
          <SalaryTemplateCreator />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalaryManagement;
