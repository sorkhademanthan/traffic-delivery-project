import React, { useState } from 'react';
import Papa from 'papaparse';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Typography,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { CloudUpload, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';

interface CSVRow {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: string;
  city: string;
  postalCode: string;
  priority?: string;
  orderValue?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  row: CSVRow;
  index: number;
}

const CSVUpload: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parsedData, setParsedData] = useState<ValidationResult[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      parseCSV(selectedFile);
    } else {
      toast.error('Please select a valid CSV file');
    }
  };

  const parseCSV = (file: File) => {
    setParsing(true);
    
    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validated = results.data.map((row, index) => 
          validateRow(row, index)
        );
        setParsedData(validated);
        setParsing(false);
      },
      error: (error) => {
        toast.error(`CSV parsing error: ${error.message}`);
        setParsing(false);
      },
    });
  };

  const validateRow = (row: CSVRow, index: number): ValidationResult => {
    const errors: string[] = [];

    if (!row.customerName?.trim()) errors.push('Customer name is required');
    if (!row.customerPhone?.trim()) errors.push('Phone is required');
    if (!row.address?.trim()) errors.push('Address is required');
    if (!row.city?.trim()) errors.push('City is required');
    if (!row.postalCode?.trim()) errors.push('Postal code is required');

    // Validate phone format (basic)
    if (row.customerPhone && !/^\+?[\d\s-()]+$/.test(row.customerPhone)) {
      errors.push('Invalid phone format');
    }

    // Validate email if provided
    if (row.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.customerEmail)) {
      errors.push('Invalid email format');
    }

    // Validate priority
    if (row.priority && !['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(row.priority.toUpperCase())) {
      errors.push('Invalid priority (must be LOW, NORMAL, HIGH, or URGENT)');
    }

    return {
      valid: errors.length === 0,
      errors,
      row,
      index: index + 2, // +2 because row 1 is header
    };
  };

  const handleUpload = async () => {
    const validRows = parsedData.filter(r => r.valid);
    
    if (validRows.length === 0) {
      toast.error('No valid rows to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const orders = validRows.map(v => ({
        customerName: v.row.customerName.trim(),
        customerPhone: v.row.customerPhone.trim(),
        customerEmail: v.row.customerEmail?.trim(),
        address: v.row.address.trim(),
        city: v.row.city.trim(),
        postalCode: v.row.postalCode.trim(),
        priority: (v.row.priority?.toUpperCase() as any) || 'NORMAL',
        orderValue: v.row.orderValue ? parseFloat(v.row.orderValue) : undefined,
      }));

      const response = await apiClient.post('/orders/bulk', { orders });
      
      setUploadProgress(100);
      toast.success(`✅ Successfully created ${response.data.created} orders!`);
      
      setTimeout(() => {
        handleClose();
        onSuccess();
      }, 1500);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFile(null);
    setParsedData([]);
    setUploadProgress(0);
  };

  const validCount = parsedData.filter(r => r.valid).length;
  const invalidCount = parsedData.length - validCount;

  return (
    <>
      <Button
        variant="contained"
        startIcon={<CloudUpload />}
        onClick={() => setOpen(true)}
      >
        Bulk Upload CSV
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle>Bulk Upload Orders from CSV</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                CSV Format Requirements:
              </Typography>
              <Typography variant="caption" component="div">
                • Required columns: customerName, customerPhone, address, city, postalCode
                <br />
                • Optional columns: customerEmail, priority (LOW/NORMAL/HIGH/URGENT), orderValue
                <br />
                • <a href="/sample-orders.csv" download>Download sample CSV template</a>
              </Typography>
            </Alert>

            <input
              accept=".csv"
              style={{ display: 'none' }}
              id="csv-file-input"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="csv-file-input">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUpload />}
                fullWidth
                size="large"
              >
                {file ? file.name : 'Select CSV File'}
              </Button>
            </label>
          </Box>

          {parsing && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>Parsing CSV...</Typography>
              <LinearProgress />
            </Box>
          )}

          {parsedData.length > 0 && (
            <>
              <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
                <Chip
                  icon={<CheckCircle />}
                  label={`${validCount} Valid`}
                  color="success"
                  variant="outlined"
                />
                <Chip
                  icon={<ErrorIcon />}
                  label={`${invalidCount} Invalid`}
                  color="error"
                  variant="outlined"
                />
              </Box>

              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Row</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Address</TableCell>
                      <TableCell>City</TableCell>
                      <TableCell>Errors</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {parsedData.map((result) => (
                      <TableRow key={result.index}>
                        <TableCell>{result.index}</TableCell>
                        <TableCell>
                          {result.valid ? (
                            <CheckCircle color="success" fontSize="small" />
                          ) : (
                            <ErrorIcon color="error" fontSize="small" />
                          )}
                        </TableCell>
                        <TableCell>{result.row.customerName}</TableCell>
                        <TableCell>{result.row.customerPhone}</TableCell>
                        <TableCell>{result.row.address}</TableCell>
                        <TableCell>{result.row.city}</TableCell>
                        <TableCell>
                          {result.errors.length > 0 && (
                            <Typography variant="caption" color="error">
                              {result.errors.join(', ')}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {uploading && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Uploading {validCount} orders...
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={uploading}>Cancel</Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={validCount === 0 || uploading}
          >
            Upload {validCount} Valid Orders
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CSVUpload;