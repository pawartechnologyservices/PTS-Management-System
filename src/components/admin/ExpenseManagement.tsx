import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Receipt, Plus, Filter, Download, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { ref, onValue, push, set, remove } from 'firebase/database';
import { database } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { toast } from '../ui/use-toast';

const ExpenseManagement = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    paidTo: '',
    department: '',
    category: '',
    paymentMethod: '',
    description: '',
    receipt: null
  });

  const departments = ['Software', 'Digital Marketing', 'Sales', 'Product Designing', 'Web Development', 'Graphic Designing', 'Office'];
  const categories = ['Office Supplies', 'Travel', 'Food & Catering', 'Equipment', 'Software Licenses', 'Marketing', 'Utilities', 'Other'];
  const paymentMethods = ['Cash', 'Bank Transfer', 'Credit Card', 'UPI', 'Cheque'];

  useEffect(() => {
    if (!user) return;

    const expensesRef = ref(database, `users/${user.id}/expenses`);
    
    const unsubscribe = onValue(expensesRef, (snapshot) => {
      const expensesData = [];
      snapshot.forEach((childSnapshot) => {
        expensesData.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      setExpenses(expensesData);
      setFilteredExpenses(expensesData);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    let filtered = expenses;

    if (filterDepartment !== 'all') {
      filtered = filtered.filter(expense => expense.department === filterDepartment);
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(expense => expense.category === filterCategory);
    }

    setFilteredExpenses(filtered);
  }, [filterDepartment, filterCategory, expenses]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      const newExpense = {
        ...formData,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: user.id
      };

      // Push new expense to Firebase
      const newExpenseRef = push(ref(database, `users/${user.id}/expenses`));
      await set(newExpenseRef, newExpense);

      toast({
        title: "Expense Added",
        description: "Expense has been successfully recorded"
      });

      setFormData({
        title: '',
        amount: '',
        paidTo: '',
        department: '',
        category: '',
        paymentMethod: '',
        description: '',
        receipt: null
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        variant: 'destructive',
        title: "Error",
        description: "Failed to add expense"
      });
    }
  };

  const handleDelete = async (expenseId) => {
    if (!user) return;
    
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      await remove(ref(database, `users/${user.id}/expenses/${expenseId}`));
      toast({
        title: "Expense Deleted",
        description: "Expense has been successfully removed"
      });
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        variant: 'destructive',
        title: "Error",
        description: "Failed to delete expense"
      });
    }
  };

  const getTotalExpenses = () => {
    return filteredExpenses.reduce((total, expense) => total + parseFloat(expense.amount || 0), 0);
  };

  const getDepartmentTotal = (department) => {
    return expenses
      .filter(expense => expense.department === department)
      .reduce((total, expense) => total + parseFloat(expense.amount || 0), 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const exportExpenses = () => {
    const csvContent = [
      ['Date', 'Title', 'Amount', 'Paid To', 'Department', 'Category', 'Payment Method', 'Description'],
      ...filteredExpenses.map(expense => [
        new Date(expense.date).toLocaleDateString(),
        expense.title,
        expense.amount,
        expense.paidTo,
        expense.department,
        expense.category,
        expense.paymentMethod,
        expense.description
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Expense Management</h1>
          <p className="text-gray-600">Track and manage company expenses</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-lg font-bold">{formatCurrency(getTotalExpenses())}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-lg font-bold">{formatCurrency(getTotalExpenses())}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Office Expenses</p>
                <p className="text-lg font-bold">{formatCurrency(getDepartmentTotal('Office'))}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Department Total</p>
                <p className="text-lg font-bold">{filteredExpenses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Add New Expense</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Expense Title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                  <Input
                    placeholder="Amount (₹)"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Paid To"
                    value={formData.paidTo}
                    onChange={(e) => setFormData({...formData, paidTo: e.target.value})}
                    required
                  />
                  <Select value={formData.department} onValueChange={(value) => setFormData({...formData, department: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({...formData, paymentMethod: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Payment Method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map(method => (
                        <SelectItem key={method} value={method}>{method}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />

                <div className="flex gap-2">
                  <Button type="submit">Add Expense</Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={exportExpenses}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Expenses List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Expenses ({filteredExpenses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredExpenses.map((expense, index) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{expense.title}</h3>
                        <Badge variant="outline">{expense.department}</Badge>
                        <Badge className="bg-green-100 text-green-700">
                          {formatCurrency(expense.amount)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                        <p>Paid to: {expense.paidTo}</p>
                        <p>Category: {expense.category}</p>
                        <p>Payment: {expense.paymentMethod}</p>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{expense.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Date: {new Date(expense.date).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(expense.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
              {filteredExpenses.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No expenses found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ExpenseManagement;