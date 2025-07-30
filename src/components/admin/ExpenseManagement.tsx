import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Receipt, Plus, Filter, Download, Trash2, Clock, AlertCircle, 
  CheckCircle2, XCircle, FileText, Calendar as CalendarIcon, 
  PieChart as PieChartIcon, BarChart2, Wallet, CreditCard, RotateCw, Bell, FileUp 
} from 'lucide-react';
import { 
  Card, CardContent, CardHeader, CardTitle, CardFooter 
} from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '../ui/select';
import { Badge } from '../ui/badge';
import { 
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow 
} from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import { ref, onValue, push, set, remove } from 'firebase/database';
import { database } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { toast } from '../ui/use-toast';
import { ErrorBoundary } from 'react-error-boundary';

// Chart.js imports
import { Chart as ChartJS, 
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend 
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface Expense {
  id: string;
  title: string;
  amount: string;
  paidTo: string;
  department: string;
  category: string;
  paymentMethod: string;
  description: string;
  date: string;
  isRecurring?: boolean;
  recurrence?: string;
  nextDueDate?: string;
  approvalRequired?: boolean;
  approvalStatus?: string;
}

interface Income {
  id: string;
  projectId: string;
  clientName: string;
  amount: string;
  receivedDate: string;
  invoiceNumber: string;
  status: string;
  milestone: string;
  description: string;
  taxAmount?: string;
  currency: string;
  exchangeRate: number;
  convertedAmount?: number;
}

interface Budget {
  id: string;
  name: string;
  amount: string;
  category: string;
  period: string;
  startDate: string;
  endDate?: string;
}

interface Approval {
  id: string;
  type: string;
  title: string;
  amount: string;
  status: string;
  requestedBy: string;
  requestedAt: string;
}

interface DateRange {
  startDate: Date;
  endDate: Date;
}

const ExpenseManagement = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddIncomeForm, setShowAddIncomeForm] = useState(false);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [filteredIncomes, setFilteredIncomes] = useState<Income[]>([]);
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState<DateRange>({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date()
  });
  const [activeTab, setActiveTab] = useState('expenses');
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    paidTo: '',
    department: '',
    category: '',
    paymentMethod: '',
    description: '',
    receipt: null,
    isRecurring: false,
    recurrence: 'none',
    nextDueDate: '',
    approvalRequired: false,
    approvalStatus: 'pending'
  });

  const [incomeFormData, setIncomeFormData] = useState({
    projectId: '',
    clientName: '',
    amount: '',
    receivedDate: new Date().toISOString().split('T')[0],
    invoiceNumber: '',
    status: 'pending',
    milestone: '',
    description: '',
    taxAmount: '',
    currency: 'INR',
    exchangeRate: 1,
    invoiceFile: null
  });

  const [budgetFormData, setBudgetFormData] = useState({
    name: '',
    amount: '',
    category: '',
    period: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });

  // Constants
  const departments = ['Software', 'Digital Marketing', 'Sales', 'Product Designing', 'Web Development', 'Graphic Designing', 'Office', 'HR', 'Finance'];
  const categories = ['Office Supplies', 'Travel', 'Food & Catering', 'Equipment', 'Software Licenses', 'Marketing', 'Utilities', 'Salaries', 'Rent', 'Maintenance', 'Other'];
  const paymentMethods = ['Cash', 'Bank Transfer', 'Credit Card', 'UPI', 'Cheque', 'PayPal', 'Other'];
  const recurrenceOptions = ['none', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
  const incomeStatuses = ['pending', 'paid', 'overdue', 'partially_paid'];
  const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'Other'];
  const budgetPeriods = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'];
  const approvalStatuses = ['pending', 'approved', 'rejected'];

  // Load data from Firebase
  useEffect(() => {
    if (!user) return;

    const expensesRef = ref(database, `users/${user.id}/expenses`);
    const incomesRef = ref(database, `users/${user.id}/incomes`);
    const projectsRef = ref(database, `users/${user.id}/projects`);
    const budgetsRef = ref(database, `users/${user.id}/budgets`);
    const approvalsRef = ref(database, `users/${user.id}/approvals`);

    const unsubscribeExpenses = onValue(expensesRef, (snapshot) => {
      const expensesData: Expense[] = [];
      snapshot.forEach((childSnapshot) => {
        expensesData.push({
          id: childSnapshot.key || '',
          ...childSnapshot.val()
        });
      });
      setExpenses(expensesData);
      setIsLoading(false);
    });

    const unsubscribeIncomes = onValue(incomesRef, (snapshot) => {
      const incomesData: Income[] = [];
      snapshot.forEach((childSnapshot) => {
        const income = childSnapshot.val();
        incomesData.push({
          id: childSnapshot.key || '',
          ...income,
          convertedAmount: parseFloat(income.amount) * parseFloat(income.exchangeRate || '1')
        });
      });
      setIncomes(incomesData);
    });

    const unsubscribeProjects = onValue(projectsRef, (snapshot) => {
      const projectsData: any[] = [];
      snapshot.forEach((childSnapshot) => {
        projectsData.push({
          id: childSnapshot.key || '',
          ...childSnapshot.val()
        });
      });
      setProjects(projectsData);
    });

    const unsubscribeBudgets = onValue(budgetsRef, (snapshot) => {
      const budgetsData: Budget[] = [];
      snapshot.forEach((childSnapshot) => {
        budgetsData.push({
          id: childSnapshot.key || '',
          ...childSnapshot.val()
        });
      });
      setBudgets(budgetsData);
    });

    const unsubscribeApprovals = onValue(approvalsRef, (snapshot) => {
      const approvalsData: Approval[] = [];
      snapshot.forEach((childSnapshot) => {
        approvalsData.push({
          id: childSnapshot.key || '',
          ...childSnapshot.val()
        });
      });
      setApprovals(approvalsData);
    });

    return () => {
      unsubscribeExpenses();
      unsubscribeIncomes();
      unsubscribeProjects();
      unsubscribeBudgets();
      unsubscribeApprovals();
    };
  }, [user]);

  // Apply filters
  useEffect(() => {
    let filteredExp = expenses;
    let filteredInc = incomes;

    // Date range filter
    filteredExp = filteredExp.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= filterDateRange.startDate && expenseDate <= filterDateRange.endDate;
    });

    filteredInc = filteredInc.filter(income => {
      const incomeDate = new Date(income.receivedDate);
      return incomeDate >= filterDateRange.startDate && incomeDate <= filterDateRange.endDate;
    });

    // Department filter
    if (filterDepartment !== 'all') {
      filteredExp = filteredExp.filter(expense => expense.department === filterDepartment);
    }

    // Category filter
    if (filterCategory !== 'all') {
      filteredExp = filteredExp.filter(expense => expense.category === filterCategory);
    }

    // Project filter
    if (filterProject !== 'all') {
      filteredInc = filteredInc.filter(income => income.projectId === filterProject);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filteredInc = filteredInc.filter(income => income.status === filterStatus);
    }

    setFilteredExpenses(filteredExp);
    setFilteredIncomes(filteredInc);
  }, [filterDepartment, filterCategory, filterProject, filterStatus, filterDateRange, expenses, incomes]);


   const getTotalByCategory = (items: any[], category: string) => {
    return items
      .filter(item => item.category === category)
      .reduce((total, item) => total + parseFloat(item.amount || 0), 0);
  };
  // Chart data
  const expenseChartData = useMemo(() => ({
    labels: categories,
    datasets: [{
      label: 'Expenses by Category',
      data: categories.map(cat => getTotalByCategory(filteredExpenses, cat)),
      backgroundColor: [
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 159, 64, 0.7)',
        'rgba(199, 199, 199, 0.7)',
        'rgba(83, 102, 255, 0.7)',
        'rgba(255, 99, 71, 0.7)',
        'rgba(147, 112, 219, 0.7)'
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)',
        'rgba(199, 199, 199, 1)',
        'rgba(83, 102, 255, 1)',
        'rgba(255, 99, 71, 1)',
        'rgba(147, 112, 219, 1)'
      ],
      borderWidth: 1
    }]
  }), [filteredExpenses]);

   const getTotal = (items: any[], field: string = 'amount') => {
    return items.reduce((total, item) => total + parseFloat(item[field] || 0), 0);
  };

  const incomeVsExpenseData = useMemo(() => ({
    labels: ['Income', 'Expenses'],
    datasets: [{
      label: 'Amount',
      data: [
        getTotal(filteredIncomes, 'convertedAmount') || 0, 
        getTotal(filteredExpenses) || 0
      ],
      backgroundColor: [
        'rgba(75, 192, 192, 0.7)',
        'rgba(255, 99, 132, 0.7)'
      ],
      borderColor: [
        'rgba(75, 192, 192, 1)',
        'rgba(255, 99, 132, 1)'
      ],
      borderWidth: 1
    }]
  }), [filteredIncomes, filteredExpenses]);

  const monthlyTrendData = useMemo(() => ({
    labels: Array.from({ length: 12 }, (_, i) => 
      new Date(0, i).toLocaleString('default', { month: 'short' })
    ),
    datasets: [
      {
        label: 'Income',
        data: Array(12).fill(0).map((_, i) => 
          getTotal(
            incomes.filter(inc => new Date(inc.receivedDate).getMonth() === i), 
            'convertedAmount'
          ) || 0
        ),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      },
      {
        label: 'Expenses',
        data: Array(12).fill(0).map((_, i) => 
          getTotal(
            expenses.filter(exp => new Date(exp.date).getMonth() === i)
          ) || 0
        ),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1
      }
    ]
  }), [incomes, expenses]);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Financial Data',
      },
    },
  };

  // Helper functions
  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // const getTotal = (items: any[], field: string = 'amount') => {
  //   return items.reduce((total, item) => total + parseFloat(item[field] || 0), 0);
  // };

  // const getTotalByCategory = (items: any[], category: string) => {
  //   return items
  //     .filter(item => item.category === category)
  //     .reduce((total, item) => total + parseFloat(item.amount || 0), 0);
  // };

  const getTotalByDepartment = (items: any[], department: string) => {
    return items
      .filter(item => item.department === department)
      .reduce((total, item) => total + parseFloat(item.amount || 0), 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'partially_paid': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'paid': return <CheckCircle2 className="h-4 w-4" />;
      case 'overdue': return <AlertCircle className="h-4 w-4" />;
      case 'partially_paid': return <RotateCw className="h-4 w-4" />;
      case 'approved': return <CheckCircle2 className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  // Form handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const newExpense = {
        ...formData,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: user.id,
        approvalStatus: formData.approvalRequired ? 'pending' : 'auto-approved'
      };

      if (formData.approvalRequired) {
        const newApprovalRef = push(ref(database, `users/${user.id}/approvals`));
        await set(newApprovalRef, {
          ...newExpense,
          type: 'expense',
          requestedBy: user.id,
          requestedAt: new Date().toISOString(),
          status: 'pending',
          approvers: ['team-lead', 'hr', 'admin']
        });
      } else {
        const newExpenseRef = push(ref(database, `users/${user.id}/expenses`));
        await set(newExpenseRef, newExpense);
      }

      toast({
        title: formData.approvalRequired ? "Approval Request Sent" : "Expense Added",
        description: formData.approvalRequired 
          ? "Expense requires approval and has been sent to the approvers" 
          : "Expense has been successfully recorded"
      });

      setFormData({
        title: '',
        amount: '',
        paidTo: '',
        department: '',
        category: '',
        paymentMethod: '',
        description: '',
        receipt: null,
        isRecurring: false,
        recurrence: 'none',
        nextDueDate: '',
        approvalRequired: false,
        approvalStatus: 'pending'
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

  const handleIncomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const newIncome = {
        ...incomeFormData,
        createdAt: new Date().toISOString(),
        createdBy: user.id,
        convertedAmount: parseFloat(incomeFormData.amount) * parseFloat(incomeFormData.exchangeRate.toString())
      };

      const newIncomeRef = push(ref(database, `users/${user.id}/incomes`));
      await set(newIncomeRef, newIncome);

      toast({
        title: "Income Recorded",
        description: "Income has been successfully recorded"
      });

      setIncomeFormData({
        projectId: '',
        clientName: '',
        amount: '',
        receivedDate: new Date().toISOString().split('T')[0],
        invoiceNumber: '',
        status: 'pending',
        milestone: '',
        description: '',
        taxAmount: '',
        currency: 'INR',
        exchangeRate: 1,
        invoiceFile: null
      });
      setShowAddIncomeForm(false);
    } catch (error) {
      console.error('Error adding income:', error);
      toast({
        variant: 'destructive',
        title: "Error",
        description: "Failed to record income"
      });
    }
  };

  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const newBudget = {
        ...budgetFormData,
        createdAt: new Date().toISOString(),
        createdBy: user.id,
        remainingAmount: budgetFormData.amount
      };

      const newBudgetRef = push(ref(database, `users/${user.id}/budgets`));
      await set(newBudgetRef, newBudget);

      toast({
        title: "Budget Created",
        description: "Budget has been successfully created"
      });

      setBudgetFormData({
        name: '',
        amount: '',
        category: '',
        period: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        endDate: ''
      });
    } catch (error) {
      console.error('Error adding budget:', error);
      toast({
        variant: 'destructive',
        title: "Error",
        description: "Failed to create budget"
      });
    }
  };

  const handleApprovalAction = async (approvalId: string, action: string) => {
    if (!user) return;

    try {
      const approvalRef = ref(database, `users/${user.id}/approvals/${approvalId}`);
      await set(approvalRef, {
        ...approvals.find(a => a.id === approvalId),
        status: action,
        approvedBy: user.id,
        approvedAt: new Date().toISOString()
      });

      if (action === 'approved') {
        const approvedExpense = approvals.find(a => a.id === approvalId);
        if (approvedExpense) {
          const newExpenseRef = push(ref(database, `users/${user.id}/expenses`));
          await set(newExpenseRef, {
            ...approvedExpense,
            approvalStatus: 'approved'
          });
        }
      }

      toast({
        title: `Request ${action}`,
        description: `The request has been ${action}`
      });
    } catch (error) {
      console.error('Error updating approval:', error);
      toast({
        variant: 'destructive',
        title: "Error",
        description: `Failed to ${action} request`
      });
    }
  };

  const handleDelete = async (type: string, id: string) => {
    if (!user) return;
    
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      await remove(ref(database, `users/${user.id}/${type}/${id}`));
      toast({
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Deleted`,
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} has been successfully removed`
      });
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      toast({
        variant: 'destructive',
        title: "Error",
        description: `Failed to delete ${type}`
      });
    }
  };

  const exportData = (type: string) => {
    let csvContent = '';
    let fileName = '';

    if (type === 'expenses') {
      csvContent = [
        ['Date', 'Title', 'Amount', 'Paid To', 'Department', 'Category', 'Payment Method', 'Description', 'Status'],
        ...filteredExpenses.map(expense => [
          new Date(expense.date).toLocaleDateString(),
          expense.title,
          expense.amount,
          expense.paidTo,
          expense.department,
          expense.category,
          expense.paymentMethod,
          expense.description,
          expense.approvalStatus
        ])
      ].map(row => row.join(',')).join('\n');
      fileName = `expenses-report-${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'incomes') {
      csvContent = [
        ['Date', 'Client', 'Project', 'Amount', 'Currency', 'Converted Amount', 'Invoice', 'Status', 'Milestone', 'Description'],
        ...filteredIncomes.map(income => [
          new Date(income.receivedDate).toLocaleDateString(),
          income.clientName,
          projects.find(p => p.id === income.projectId)?.name || 'N/A',
          income.amount,
          income.currency,
          income.convertedAmount,
          income.invoiceNumber,
          income.status,
          income.milestone,
          income.description
        ])
      ].map(row => row.join(',')).join('\n');
      fileName = `incomes-report-${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'budgets') {
      csvContent = [
        ['Name', 'Amount', 'Category', 'Period', 'Start Date', 'End Date', 'Remaining'],
        ...budgets.map(budget => [
          budget.name,
          budget.amount,
          budget.category,
          budget.period,
          budget.startDate,
          budget.endDate,
          budget.remainingAmount
        ])
      ].map(row => row.join(',')).join('\n');
      fileName = `budgets-report-${new Date().toISOString().split('T')[0]}.csv`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Budget utilization
  const budgetUtilization = budgets.map(budget => {
    const usedAmount = getTotal(
      expenses.filter(exp => exp.category === budget.category),
      'amount'
    );
    const utilization = (usedAmount / parseFloat(budget.amount)) * 100;
    
    return {
      ...budget,
      usedAmount,
      utilization: Math.min(100, utilization)
    };
  });

  // Pending approvals
  const pendingApprovals = approvals.filter(a => a.status === 'pending');

  // Overdue invoices
  const overdueIncomes = incomes.filter(income => 
    income.status === 'overdue' || 
    (income.status === 'pending' && new Date(income.receivedDate) < new Date())
  );

  // Recurring expenses
  const recurringExpenses = expenses.filter(exp => exp.isRecurring);

  // DateRangePicker component
  const DateRangePicker = ({ dateRange, onDateRangeChange }: { dateRange: DateRange, onDateRangeChange: (range: DateRange) => void }) => {
    const [startDate, setStartDate] = React.useState<Date | undefined>(dateRange.startDate);
    const [endDate, setEndDate] = React.useState<Date | undefined>(dateRange.endDate);

    React.useEffect(() => {
      if (startDate && endDate) {
        onDateRangeChange({ startDate, endDate });
      }
    }, [startDate, endDate, onDateRangeChange]);

    return (
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-[240px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "PPP") : <span>Start date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <span className="mx-1">to</span>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-[240px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, "PPP") : <span>End date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={setEndDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  // Error boundary fallback
  const ChartErrorFallback = ({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) => {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Chart failed to load</p>
        <button 
          onClick={resetErrorBoundary}
          className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded"
        >
          Try again
        </button>
      </div>
    );
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Finance Dashboard</h1>
          <p className="text-gray-600">Track and manage company finances</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddIncomeForm(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Income
          </Button>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Income</p>
                <p className="text-lg font-bold">
                  {formatCurrency(getTotal(filteredIncomes, 'convertedAmount'))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-lg font-bold">
                  {formatCurrency(getTotal(filteredExpenses))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Net Profit</p>
                <p className="text-lg font-bold">
                  {formatCurrency(
                    getTotal(filteredIncomes, 'convertedAmount') - 
                    getTotal(filteredExpenses)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Pending Approvals</p>
                <p className="text-lg font-bold">
                  {pendingApprovals.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ErrorBoundary FallbackComponent={ChartErrorFallback}>
              <Bar data={incomeVsExpenseData} options={chartOptions} />
            </ErrorBoundary>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ErrorBoundary FallbackComponent={ChartErrorFallback}>
              <Pie data={expenseChartData} options={chartOptions} />
            </ErrorBoundary>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ErrorBoundary FallbackComponent={ChartErrorFallback}>
              <Line data={monthlyTrendData} options={chartOptions} />
            </ErrorBoundary>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Budget Utilization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {budgetUtilization.map(budget => (
              <div key={budget.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{budget.name}</span>
                  <span>
                    {formatCurrency(budget.usedAmount)} / {formatCurrency(budget.amount)}
                  </span>
                </div>
                <Progress 
                  value={budget.utilization} 
                  className="h-2"
                  indicatorColor={budget.utilization > 80 ? 'bg-red-500' : budget.utilization > 50 ? 'bg-yellow-500' : 'bg-green-500'}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{budget.category}</span>
                  <span>{Math.round(budget.utilization)}% used</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Overdue Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueIncomes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueIncomes.map(income => (
                    <TableRow key={income.id}>
                      <TableCell>{income.clientName}</TableCell>
                      <TableCell>{formatCurrency(parseFloat(income.amount), income.currency)}</TableCell>
                      <TableCell>{new Date(income.receivedDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDelete('incomes', income.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No overdue invoices
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingApprovals.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingApprovals.map(approval => (
                    <TableRow key={approval.id}>
                      <TableCell>{approval.title}</TableCell>
                      <TableCell>{formatCurrency(parseFloat(approval.amount))}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{approval.type}</Badge>
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleApprovalAction(approval.id, 'approved')}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleApprovalAction(approval.id, 'rejected')}
                        >
                          Reject
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No pending approvals
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full md:w-1/2">
          <TabsTrigger value="expenses">
            <CreditCard className="h-4 w-4 mr-2" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="incomes">
            <Wallet className="h-4 w-4 mr-2" />
            Income
          </TabsTrigger>
          <TabsTrigger value="budgets">
            <PieChartIcon className="h-4 w-4 mr-2" />
            Budgets
          </TabsTrigger>
          <TabsTrigger value="recurring">
            <RotateCw className="h-4 w-4 mr-2" />
            Recurring
          </TabsTrigger>
        </TabsList>

        {/* Expenses Tab */}
        <TabsContent value="expenses">
          <div className="space-y-4">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                    <SelectTrigger className="w-full md:w-48">
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
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filter by Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <DateRangePicker 
                    dateRange={filterDateRange}
                    onDateRangeChange={setFilterDateRange}
                  />
                  <Button onClick={() => exportData('expenses')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Expenses List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
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
                            <Badge className={getStatusColor(expense.approvalStatus || '')}>
                              {getStatusIcon(expense.approvalStatus || '')}
                              <span className="ml-1">{expense.approvalStatus}</span>
                            </Badge>
                            <Badge className="bg-green-100 text-green-700">
                              {formatCurrency(parseFloat(expense.amount))}
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
                            {expense.isRecurring && (
                              <span className="ml-2 text-blue-500">• Recurring ({expense.recurrence})</span>
                            )}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete('expenses', expense.id)}
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
          </div>
        </TabsContent>

        {/* Income Tab */}
        <TabsContent value="incomes">
          <div className="space-y-4">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <Select value={filterProject} onValueChange={setFilterProject}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filter by Project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {incomeStatuses.map(status => (
                        <SelectItem key={status} value={status}>
                          {status.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <DateRangePicker 
                    dateRange={filterDateRange}
                    onDateRangeChange={setFilterDateRange}
                  />
                  <Button onClick={() => exportData('incomes')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Income List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Income ({filteredIncomes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIncomes.map((income) => (
                      <TableRow key={income.id}>
                        <TableCell>{new Date(income.receivedDate).toLocaleDateString()}</TableCell>
                        <TableCell>{income.clientName}</TableCell>
                        <TableCell>
                          {projects.find(p => p.id === income.projectId)?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(parseFloat(income.amount), income.currency)}
                          {income.currency !== 'INR' && (
                            <span className="text-xs text-gray-500 block">
                              ≈ {formatCurrency(income.convertedAmount || 0)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{income.invoiceNumber || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(income.status)}>
                            {getStatusIcon(income.status)}
                            <span className="ml-1">
                              {income.status.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete('incomes', income.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredIncomes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No income records found
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Budgets Tab */}
        <TabsContent value="budgets">
          <div className="space-y-4">
            {/* Add Budget Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4" />
                  Create New Budget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBudgetSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Budget Name"
                      value={budgetFormData.name}
                      onChange={(e) => setBudgetFormData({...budgetFormData, name: e.target.value})}
                      required
                    />
                    <Input
                      placeholder="Amount (₹)"
                      type="number"
                      value={budgetFormData.amount}
                      onChange={(e) => setBudgetFormData({...budgetFormData, amount: e.target.value})}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select 
                      value={budgetFormData.category} 
                      onValueChange={(value) => setBudgetFormData({...budgetFormData, category: value})}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select 
                      value={budgetFormData.period} 
                      onValueChange={(value) => setBudgetFormData({...budgetFormData, period: value})}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Period" />
                      </SelectTrigger>
                      <SelectContent>
                        {budgetPeriods.map(period => (
                          <SelectItem key={period} value={period}>
                            {period.charAt(0).toUpperCase() + period.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      type="date"
                      value={budgetFormData.startDate}
                      onChange={(e) => setBudgetFormData({...budgetFormData, startDate: e.target.value})}
                      required
                    />
                    {budgetFormData.period === 'custom' && (
                      <Input
                        type="date"
                        value={budgetFormData.endDate}
                        onChange={(e) => setBudgetFormData({...budgetFormData, endDate: e.target.value})}
                        required={budgetFormData.period === 'custom'}
                      />
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">Create Budget</Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => exportData('budgets')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Budgets
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Budgets List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4" />
                  Budgets ({budgets.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Used</TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgets.map((budget) => {
                      const usedAmount = getTotal(
                        expenses.filter(exp => exp.category === budget.category),
                        'amount'
                      );
                      const remainingAmount = parseFloat(budget.amount) - usedAmount;
                      const utilization = (usedAmount / parseFloat(budget.amount)) * 100;

                      return (
                        <TableRow key={budget.id}>
                          <TableCell>{budget.name}</TableCell>
                          <TableCell>{budget.category}</TableCell>
                          <TableCell>
                            {budget.period.charAt(0).toUpperCase() + budget.period.slice(1)}
                          </TableCell>
                          <TableCell>{formatCurrency(parseFloat(budget.amount))}</TableCell>
                          <TableCell>
                            {formatCurrency(usedAmount)}
                            <Progress 
                              value={utilization} 
                              className="h-2 mt-1" 
                              indicatorColor={utilization > 80 ? 'bg-red-500' : utilization > 50 ? 'bg-yellow-500' : 'bg-green-500'}
                            />
                          </TableCell>
                          <TableCell>
                            {formatCurrency(remainingAmount)}
                            <span className={`text-xs block ${remainingAmount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                              ({Math.round(utilization)}%)
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete('budgets', budget.id)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {budgets.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No budgets created yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recurring Tab */}
        <TabsContent value="recurring">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCw className="h-4 w-4" />
                  Recurring Expenses ({recurringExpenses.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Next Due</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recurringExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{expense.title}</TableCell>
                        <TableCell>{formatCurrency(parseFloat(expense.amount))}</TableCell>
                        <TableCell>
                          {expense.recurrence?.charAt(0).toUpperCase() + expense.recurrence?.slice(1)}
                        </TableCell>
                        <TableCell>
                          {expense.nextDueDate ? new Date(expense.nextDueDate).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete('expenses', expense.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {recurringExpenses.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No recurring expenses found
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Expense Modal */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
                  <Select 
                    value={formData.department} 
                    onValueChange={(value) => setFormData({...formData, department: value})}
                    required
                  >
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
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({...formData, category: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select 
                    value={formData.paymentMethod} 
                    onValueChange={(value) => setFormData({...formData, paymentMethod: value})}
                    required
                  >
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isRecurring"
                      checked={formData.isRecurring}
                      onChange={(e) => setFormData({...formData, isRecurring: e.target.checked})}
                      className="h-4 w-4"
                    />
                    <label htmlFor="isRecurring">Recurring Expense</label>
                  </div>

                  {formData.isRecurring && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select 
                        value={formData.recurrence} 
                        onValueChange={(value) => setFormData({...formData, recurrence: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Recurrence" />
                        </SelectTrigger>
                        <SelectContent>
                          {recurrenceOptions.map(option => (
                            <SelectItem key={option} value={option}>
                              {option.charAt(0).toUpperCase() + option.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="date"
                        placeholder="Next Due Date"
                        value={formData.nextDueDate}
                        onChange={(e) => setFormData({...formData, nextDueDate: e.target.value})}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="approvalRequired"
                    checked={formData.approvalRequired}
                    onChange={(e) => setFormData({...formData, approvalRequired: e.target.checked})}
                    className="h-4 w-4"
                  />
                  <label htmlFor="approvalRequired">Requires Approval</label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">Add Expense</Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Add Income Modal */}
      {showAddIncomeForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Record New Income</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleIncomeSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select 
                    value={incomeFormData.projectId} 
                    onValueChange={(value) => setIncomeFormData({...incomeFormData, projectId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Client Name"
                    value={incomeFormData.clientName}
                    onChange={(e) => setIncomeFormData({...incomeFormData, clientName: e.target.value})}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Amount"
                    type="number"
                    value={incomeFormData.amount}
                    onChange={(e) => setIncomeFormData({...incomeFormData, amount: e.target.value})}
                    required
                  />
                  <Select 
                    value={incomeFormData.currency} 
                    onValueChange={(value) => setIncomeFormData({...incomeFormData, currency: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map(currency => (
                        <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {incomeFormData.currency !== 'INR' && (
                    <Input
                      placeholder="Exchange Rate"
                      type="number"
                      step="0.0001"
                      value={incomeFormData.exchangeRate}
                      onChange={(e) => setIncomeFormData({...incomeFormData, exchangeRate: parseFloat(e.target.value)})}
                      required={incomeFormData.currency !== 'INR'}
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    type="date"
                    value={incomeFormData.receivedDate}
                    onChange={(e) => setIncomeFormData({...incomeFormData, receivedDate: e.target.value})}
                    required
                  />
                  <Select 
                    value={incomeFormData.status} 
                    onValueChange={(value) => setIncomeFormData({...incomeFormData, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Payment Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {incomeStatuses.map(status => (
                        <SelectItem key={status} value={status}>
                          {status.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Invoice Number"
                    value={incomeFormData.invoiceNumber}
                    onChange={(e) => setIncomeFormData({...incomeFormData, invoiceNumber: e.target.value})}
                  />
                  <Input
                    placeholder="Milestone"
                    value={incomeFormData.milestone}
                    onChange={(e) => setIncomeFormData({...incomeFormData, milestone: e.target.value})}
                  />
                </div>

                <Textarea
                  placeholder="Description"
                  value={incomeFormData.description}
                  onChange={(e) => setIncomeFormData({...incomeFormData, description: e.target.value})}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Tax Amount"
                    type="number"
                    value={incomeFormData.taxAmount}
                    onChange={(e) => setIncomeFormData({...incomeFormData, taxAmount: e.target.value})}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload Invoice</label>
                    <Input
                      type="file"
                      onChange={(e) => {
                        if (e.target.files) {
                          setIncomeFormData({...incomeFormData, invoiceFile: e.target.files[0]});
                        }
                      }}
                      accept=".pdf,.jpg,.png"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">Record Income</Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAddIncomeForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default ExpenseManagement;