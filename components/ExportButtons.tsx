'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, BorderStyle, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { toast } from 'react-toastify';

interface ExportColumn {
    name: string;
    selector: string | ((row: any) => any);
    format?: (row: any) => string;
}

interface ExportButtonsProps {
    data: any[];
    columns: ExportColumn[];
    fileName?: string;
}

export default function ExportButtons({ data, columns, fileName = 'export' }: ExportButtonsProps) {
    const { t } = useLanguage();

    const formatCellValue = (row: any, column: ExportColumn): string => {
        try {
            let value;

            if (typeof column.selector === 'function') {
                value = column.selector(row);
            } else {
                // Handle nested properties like 'location.latitude'
                const keys = column.selector.split('.');
                value = keys.reduce((obj, key) => obj?.[key], row);
            }

            // Apply custom format if available
            if (column.format) {
                return column.format(row);
            }

            // Handle different value types
            if (value === null || value === undefined) {
                return '';
            }
            if (value instanceof Date) {
                return value.toLocaleString();
            }
            if (typeof value === 'object') {
                return JSON.stringify(value);
            }
            return String(value);
        } catch (error) {
            console.error('Error formatting cell:', error);
            return '';
        }
    };

    const exportToExcel = () => {
        try {
            // Prepare data
            const exportData = data.map(row => {
                const rowData: any = {};
                columns.forEach(col => {
                    rowData[col.name] = formatCellValue(row, col);
                });
                return rowData;
            });

            // Create workbook and worksheet
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Data');

            // Auto-size columns
            const maxWidth = 50;
            const colWidths = columns.map(col => {
                const headerLength = col.name.length;
                const maxDataLength = Math.max(
                    ...data.map(row => String(formatCellValue(row, col)).length)
                );
                return { wch: Math.min(Math.max(headerLength, maxDataLength) + 2, maxWidth) };
            });
            ws['!cols'] = colWidths;

            // Write file
            XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
            toast.success('Excel file exported successfully');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            toast.error('Failed to export to Excel');
        }
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            // Prepare table data
            const headers = columns.map(col => col.name);
            const body = data.map(row =>
                columns.map(col => formatCellValue(row, col))
            );

            // Add title
            doc.setFontSize(16);
            doc.text(fileName, 14, 15);

            // Add table
            autoTable(doc, {
                head: [headers],
                body: body,
                startY: 25,
                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                },
                headStyles: {
                    fillColor: [79, 70, 229], // Indigo color
                    textColor: 255,
                    fontStyle: 'bold',
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245],
                },
                margin: { top: 25 },
            });

            // Save PDF
            doc.save(`${fileName}_${new Date().toISOString().slice(0, 10)}.pdf`);
            toast.success('PDF file exported successfully');
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            toast.error('Failed to export to PDF');
        }
    };

    const exportToWord = async () => {
        try {
            // Create table rows
            const tableRows = [
                // Header row
                new TableRow({
                    children: columns.map(col =>
                        new TableCell({
                            children: [new Paragraph({
                                children: [new TextRun({ text: col.name, bold: true })],
                            })],
                            shading: {
                                fill: "4F46E5",
                                color: "FFFFFF",
                            },
                        })
                    ),
                }),
                // Data rows
                ...data.map(row =>
                    new TableRow({
                        children: columns.map(col =>
                            new TableCell({
                                children: [new Paragraph(formatCellValue(row, col))],
                            })
                        ),
                    })
                ),
            ];

            // Create table
            const table = new Table({
                width: {
                    size: 100,
                    type: WidthType.PERCENTAGE,
                },
                rows: tableRows,
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                    insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
                    insideVertical: { style: BorderStyle.SINGLE, size: 1 },
                },
            });

            // Create document
            const doc = new Document({
                sections: [{
                    children: [
                        new Paragraph({
                            text: fileName,
                            heading: 'Heading1',
                            spacing: { after: 200 },
                        }),
                        table,
                    ],
                }],
            });

            // Generate and save
            const blob = await Packer.toBlob(doc);
            saveAs(blob, `${fileName}_${new Date().toISOString().slice(0, 10)}.docx`);
            toast.success('Word file exported successfully');
        } catch (error) {
            console.error('Error exporting to Word:', error);
            toast.error('Failed to export to Word');
        }
    };

    return (
        <div className="flex gap-2 mb-4">
            <button
                onClick={exportToExcel}
                className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-sm transition-colors"
            >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L13 1.586A2 2 0 0011.586 1H9z" />
                    <path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
                {t('export.excel' as any)}
            </button>

            <button
                onClick={exportToPDF}
                className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm transition-colors"
            >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                {t('export.pdf' as any)}
            </button>

            <button
                onClick={exportToWord}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors"
            >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                {t('export.word' as any)}
            </button>
        </div>
    );
}
