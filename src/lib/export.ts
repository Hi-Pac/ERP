import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import type { Invoice, Customer, Product, Payment } from '@/types';

// PDF Export utilities
export const exportToPDF = async (
  data: any[],
  title: string,
  columns: Array<{ header: string; key: string; width?: number }>
): Promise<void> => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Add title
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;

  // Add date
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition);
  yPosition += 15;

  // Table headers
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  
  const columnWidth = (pageWidth - 2 * margin) / columns.length;
  let xPosition = margin;

  columns.forEach((column) => {
    pdf.text(column.header, xPosition, yPosition);
    xPosition += columnWidth;
  });

  yPosition += 10;
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Table data
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);

  data.forEach((row, index) => {
    if (yPosition > pageHeight - 30) {
      pdf.addPage();
      yPosition = margin;
    }

    xPosition = margin;
    columns.forEach((column) => {
      const value = row[column.key] || '';
      pdf.text(String(value), xPosition, yPosition);
      xPosition += columnWidth;
    });

    yPosition += 8;
  });

  pdf.save(`${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
};

// Excel Export utilities
export const exportToExcel = (
  data: any[],
  filename: string,
  sheetName: string = 'Sheet1'
): void => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  const excelFilename = `${filename}_${new Date().getTime()}.xlsx`;
  XLSX.writeFile(workbook, excelFilename);
};

// Invoice-specific PDF export
export const exportInvoiceToPDF = async (invoice: Invoice, customer: Customer): Promise<void> => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPosition = 20;

  // Company Header
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('HCP COMPANY', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Complete ERP Solutions', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;

  // Invoice Title
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(invoice.type === 'return' ? 'RETURN INVOICE' : 'INVOICE', 20, yPosition);
  yPosition += 15;

  // Invoice Details
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  
  const invoiceDetails = [
    [`Invoice Number:`, invoice.orderNumber],
    [`Date:`, new Date(invoice.date).toLocaleDateString()],
    [`Customer:`, customer.fullName],
    [`Phone:`, customer.phone],
    [`Address:`, customer.address],
    [`Payment Method:`, invoice.paymentMethod]
  ];

  invoiceDetails.forEach(([label, value]) => {
    pdf.setFont('helvetica', 'bold');
    pdf.text(label, 20, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(value, 70, yPosition);
    yPosition += 8;
  });

  yPosition += 10;

  // Items table header
  pdf.setFont('helvetica', 'bold');
  pdf.text('Product', 20, yPosition);
  pdf.text('Qty', 120, yPosition);
  pdf.text('Unit Price', 140, yPosition);
  pdf.text('Total', 170, yPosition);
  
  yPosition += 5;
  pdf.line(20, yPosition, 190, yPosition);
  yPosition += 10;

  // Items
  pdf.setFont('helvetica', 'normal');
  invoice.items.forEach((item) => {
    pdf.text(item.productName, 20, yPosition);
    pdf.text(item.quantity.toString(), 120, yPosition);
    pdf.text(`$${item.unitPrice.toFixed(2)}`, 140, yPosition);
    pdf.text(`$${item.total.toFixed(2)}`, 170, yPosition);
    yPosition += 8;
  });

  yPosition += 10;
  pdf.line(20, yPosition, 190, yPosition);
  yPosition += 10;

  // Totals
  const totals = [
    [`Subtotal:`, `$${invoice.subtotal.toFixed(2)}`],
    [`Discount (${invoice.discountRate}%):`, `$${invoice.discountAmount.toFixed(2)}`],
    [`Total:`, `$${invoice.total.toFixed(2)}`]
  ];

  totals.forEach(([label, value]) => {
    pdf.setFont('helvetica', invoice.type === 'return' ? 'normal' : 'bold');
    pdf.text(label, 140, yPosition);
    pdf.text(value, 170, yPosition);
    yPosition += 8;
  });

  // Deposit information
  if (invoice.deposit) {
    yPosition += 5;
    pdf.text(`Deposit: $${invoice.deposit.amount.toFixed(2)} (${invoice.deposit.method})`, 140, yPosition);
    pdf.text(`Status: ${invoice.deposit.paid ? 'Paid' : 'Pending'}`, 140, yPosition + 8);
  }

  // Notes
  if (invoice.notes) {
    yPosition += 20;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Notes:', 20, yPosition);
    yPosition += 8;
    pdf.setFont('helvetica', 'normal');
    const splitNotes = pdf.splitTextToSize(invoice.notes, 170);
    pdf.text(splitNotes, 20, yPosition);
  }

  pdf.save(`invoice_${invoice.orderNumber}.pdf`);
};

// Customer Statement PDF export
export const exportCustomerStatementToPDF = async (
  customer: Customer,
  transactions: any[],
  startDate?: string,
  endDate?: string
): Promise<void> => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPosition = 20;

  // Header
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CUSTOMER STATEMENT', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;

  // Customer details
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Customer: ${customer.fullName}`, 20, yPosition);
  yPosition += 8;
  pdf.text(`Phone: ${customer.phone}`, 20, yPosition);
  yPosition += 8;
  pdf.text(`Address: ${customer.address}`, 20, yPosition);
  yPosition += 15;

  if (startDate && endDate) {
    pdf.text(`Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`, 20, yPosition);
    yPosition += 15;
  }

  // Transaction table
  pdf.setFont('helvetica', 'bold');
  pdf.text('Date', 20, yPosition);
  pdf.text('Description', 50, yPosition);
  pdf.text('Debit', 130, yPosition);
  pdf.text('Credit', 155, yPosition);
  pdf.text('Balance', 180, yPosition);
  
  yPosition += 5;
  pdf.line(20, yPosition, 200, yPosition);
  yPosition += 8;

  pdf.setFont('helvetica', 'normal');
  transactions.forEach((transaction) => {
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.text(new Date(transaction.date).toLocaleDateString(), 20, yPosition);
    pdf.text(transaction.description, 50, yPosition);
    pdf.text(transaction.debit > 0 ? `$${transaction.debit.toFixed(2)}` : '-', 130, yPosition);
    pdf.text(transaction.credit > 0 ? `$${transaction.credit.toFixed(2)}` : '-', 155, yPosition);
    pdf.text(`$${transaction.balance.toFixed(2)}`, 180, yPosition);
    yPosition += 8;
  });

  // Final balance
  yPosition += 10;
  pdf.line(20, yPosition, 200, yPosition);
  yPosition += 10;
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Current Balance: $${customer.balance.toFixed(2)}`, 140, yPosition);

  pdf.save(`statement_${customer.fullName.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
};

// Print utilities
export const printElement = async (elementId: string): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  const canvas = await html2canvas(element);
  const imgData = canvas.toDataURL('image/png');
  
  const pdf = new jsPDF();
  const imgWidth = 210;
  const pageHeight = 295;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(`print_${new Date().getTime()}.pdf`);
};
