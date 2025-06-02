import React, { useState, useEffect } from 'react';
import { Button, CircularProgress } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import jsPDF from 'jspdf';
import apiService from '../../services/api';
import { useReportStore } from '../../store/reportStore';

export default function ExportButton({ goalId }) {
  const [exporting, setExporting] = useState(false);
  const [goalData, setGoalData] = useState(null);
  
  // Use Zustand store to access reports
  const { setReport, getReport } = useReportStore();
  const reportData = getReport(goalId);

  // Get goal data - prioritize Zustand store data
  useEffect(() => {
    if (goalId) {
      fetchGoalData(goalId);
    }
  }, [goalId]);

  const fetchGoalData = async (goalId) => {
    try {
      // Check if we already have report data for this goal in the store
      const existingReport = getReport(goalId);
      
      if (existingReport && existingReport.goalDetails) {
        console.log("Using cached goal data from reportStore");
        setGoalData(existingReport.goalDetails);
        return;
      }
      
      // Otherwise fetch from API
      console.log("Fetching goal data from API");
      const response = await apiService.goals.getById(goalId);
      if (response && response.data && response.data.data) {
        const fetchedGoalData = response.data.data;
        setGoalData(fetchedGoalData);
        
        // Store the goal data in the report store for future use
        if (existingReport) {
          // Update existing report with goal details
          setReport(goalId, {
            ...existingReport,
            goalDetails: fetchedGoalData
          });
        } else {
          // Create a new report entry with just goal details
          setReport(goalId, {
            goalDetails: fetchedGoalData,
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.error("Error fetching goal data:", err);
    }
  };

  // Function to directly access declaration content without opening dialog
  const getDeclarationContent = (goalData) => {
    if (goalData?.declaration?.content) {
      return goalData.declaration.content;
    }
    return null;
  };

  const handleExport = async (e) => {
    // Prevent event propagation to avoid triggering other handlers
    e.stopPropagation();
    
    try {
      setExporting(true);
      console.log("Starting PDF export");
      
      if (!goalData) {
        console.error("No goal data available, cannot export report");
        alert("Failed to fetch goal data, please try again");
        setExporting(false);
        return;
      }
      
      // Initialize PDF with UTF-8 support (A4 paper)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
        putOnlyUsedFonts: true,
        compress: true
      });

      pdf.setFont("helvetica", "normal"); // Set consistent font throughout
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const pdfMargin = 40; // Margin
      const contentWidth = pdfWidth - (pdfMargin * 2); // Available content width
      let yPosition = pdfMargin; // Starting Y coordinate
      
      // Add title
      pdf.setFontSize(20);
      pdf.setTextColor(0, 51, 102);
      const title = `Goal Progress Report - ${goalData.title}`;
      pdf.text(title, pdfWidth / 2, yPosition, { align: 'center' });
      yPosition += 30;

      // Add date
      pdf.setFontSize(12);
      pdf.setTextColor(102, 102, 102);
      const dateText = `Report generated on: ${new Date().toLocaleDateString()}`;
      pdf.text(dateText, pdfWidth / 2, yPosition, { align: 'center' });
      yPosition += 40;

      // Add AI analysis section if available from report store
      if (reportData && reportData.content) {
        pdf.setFontSize(16);
        pdf.setTextColor(0, 102, 204);
        pdf.text("1. AI Analysis", pdfMargin, yPosition);
        yPosition += 20;

        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        const analysisText = pdf.splitTextToSize(reportData.content, contentWidth);
        pdf.text(analysisText, pdfMargin, yPosition);
        yPosition += analysisText.length * 14 + 30;

        // Check remaining space, add new page if needed
        if (yPosition > pdfHeight - 100) {
          pdf.addPage();
          yPosition = pdfMargin;
        }
      }

      // Add basic information section
      pdf.setFontSize(16);
      pdf.setTextColor(0, 102, 204);
      pdf.text((reportData && reportData.content) ? "2. Basic Information" : "1. Basic Information", pdfMargin, yPosition);
      yPosition += 20;

      // Set table styles
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.setDrawColor(220, 220, 220);
      pdf.setFillColor(240, 240, 240);

      // Create basic info table
      const basicInfoRows = [
        ["Created Date", new Date(goalData.createdAt).toLocaleDateString()],
        ["Priority", goalData.priority || "None"],
        ["Status", goalData.status === "active" ? "In Progress" : goalData.status === "completed" ? "Completed" : "Archived"],
        ["Target Date", goalData.targetDate ? new Date(goalData.targetDate).toLocaleDateString() : "None"],
        ["Completion Date", goalData.status === "completed" ? "Completed" : "Not completed"]
      ];

      const colWidth = contentWidth / 2;
      const rowHeight = 30;

      // Draw table header
      pdf.setFillColor(220, 220, 220);
      pdf.rect(pdfMargin, yPosition, contentWidth, rowHeight, 'F');
      pdf.setFont("helvetica", "bold");
      pdf.text("Field", pdfMargin + 10, yPosition + 20);
      pdf.text("Value", pdfMargin + colWidth + 10, yPosition + 20);
      pdf.setFont("helvetica", "normal");
      yPosition += rowHeight;

      // Draw table content
      for (let i = 0; i < basicInfoRows.length; i++) {
        const row = basicInfoRows[i];
        pdf.rect(pdfMargin, yPosition, colWidth, rowHeight);
        pdf.rect(pdfMargin + colWidth, yPosition, colWidth, rowHeight);
        pdf.text(row[0], pdfMargin + 10, yPosition + 20);
        pdf.text(row[1], pdfMargin + colWidth + 10, yPosition + 20);
        yPosition += rowHeight;
      }
      yPosition += 20;

      // Add goal description
      const sectionIndex = (reportData && reportData.content) ? 3 : 2;
      pdf.setFontSize(16);
      pdf.setTextColor(0, 102, 204);
      pdf.text(`${sectionIndex}. Goal Description`, pdfMargin, yPosition);
      yPosition += 20;

      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      const descText = pdf.splitTextToSize(goalData.description || "None", contentWidth);
      pdf.text(descText, pdfMargin, yPosition);
      yPosition += descText.length * 14 + 20;

      // Add motivation
      pdf.setFontSize(16);
      pdf.setTextColor(0, 102, 204);
      pdf.text(`${sectionIndex + 1}. Motivation`, pdfMargin, yPosition);
      yPosition += 20;

      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      const motivationText = pdf.splitTextToSize(goalData.motivation || goalData.details?.motivation || "None", contentWidth);
      pdf.text(motivationText, pdfMargin, yPosition);
      yPosition += motivationText.length * 14 + 20;

      // Check remaining space, add new page if needed
      if (yPosition > pdfHeight - 100) {
        pdf.addPage();
        yPosition = pdfMargin;
      }

      // Add daily tasks section
      pdf.setFontSize(16);
      pdf.setTextColor(0, 102, 204);
      pdf.text(`${sectionIndex + 2}. Daily Tasks`, pdfMargin, yPosition);
      yPosition += 20;

      if (goalData.dailyTasks && goalData.dailyTasks.length > 0) {
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        
        goalData.dailyTasks.forEach((task, index) => {
          const taskText = pdf.splitTextToSize(`• ${task}`, contentWidth);
          pdf.text(taskText, pdfMargin, yPosition);
          yPosition += taskText.length * 14; // Adjust based on number of lines
          
          // Check remaining space
          if (yPosition > pdfHeight - 60 && index < goalData.dailyTasks.length - 1) {
            pdf.addPage();
            yPosition = pdfMargin;
          }
        });
      } else {
        pdf.setFontSize(10);
        pdf.text("No daily tasks set", pdfMargin, yPosition);
        yPosition += 20;
      }
      
      yPosition += 20;

      // Check remaining space
      if (yPosition > pdfHeight - 150) {
        pdf.addPage();
        yPosition = pdfMargin;
      }

      // Add rewards section
      pdf.setFontSize(16);
      pdf.setTextColor(0, 102, 204);
      pdf.text(`${sectionIndex + 3}. Rewards`, pdfMargin, yPosition);
      yPosition += 20;

      if (goalData.rewards && goalData.rewards.length > 0) {
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        
        goalData.rewards.forEach((reward, index) => {
          const rewardText = pdf.splitTextToSize(`• ${reward}`, contentWidth);
          pdf.text(rewardText, pdfMargin, yPosition);
          yPosition += rewardText.length * 14;
          
          if (yPosition > pdfHeight - 60 && index < goalData.rewards.length - 1) {
            pdf.addPage();
            yPosition = pdfMargin;
          }
        });
      } else {
        pdf.setFontSize(10);
        pdf.text("No rewards set", pdfMargin, yPosition);
        yPosition += 20;
      }
      
      yPosition += 20;

      // Check remaining space
      if (yPosition > pdfHeight - 150) {
        pdf.addPage();
        yPosition = pdfMargin;
      }

      // Add resources section
      pdf.setFontSize(16);
      pdf.setTextColor(0, 102, 204);
      pdf.text(`${sectionIndex + 4}. Resources`, pdfMargin, yPosition);
      yPosition += 20;

      if (goalData.resources && goalData.resources.length > 0) {
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        
        goalData.resources.forEach((resource, index) => {
          const resourceText = pdf.splitTextToSize(`• ${resource}`, contentWidth);
          pdf.text(resourceText, pdfMargin, yPosition);
          yPosition += resourceText.length * 14;
          
          if (yPosition > pdfHeight - 60 && index < goalData.resources.length - 1) {
            pdf.addPage();
            yPosition = pdfMargin;
          }
        });
      } else {
        pdf.setFontSize(10);
        pdf.text("No resources added", pdfMargin, yPosition);
        yPosition += 20;
      }
      
      yPosition += 20;

      // Check remaining space
      if (yPosition > pdfHeight - 200) {
        pdf.addPage();
        yPosition = pdfMargin;
      }

      // Add daily completion status
      if (goalData.dailyCards && goalData.dailyCards.length > 0) {
        pdf.setFontSize(16);
        pdf.setTextColor(0, 102, 204);
        pdf.text(`${sectionIndex + 5}. Daily Task Completion`, pdfMargin, yPosition);
        yPosition += 20;

        // Create table header
        pdf.setFillColor(220, 220, 220);
        pdf.rect(pdfMargin, yPosition, contentWidth, rowHeight, 'F');
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        
        // Adjust column widths based on content
        const dateWidth = 100;
        const taskWidth = contentWidth - dateWidth - 180; // Allocate space for task text
        const statusWidth = 90;
        
        pdf.text("Date", pdfMargin + 10, yPosition + 20);
        pdf.text("Daily Task", pdfMargin + dateWidth + 10, yPosition + 20);
        pdf.text("Completed", pdfMargin + dateWidth + taskWidth + 10, yPosition + 20);
        pdf.text("Records", pdfMargin + dateWidth + taskWidth + statusWidth + 10, yPosition + 20);
        pdf.setFont("helvetica", "normal");
        yPosition += rowHeight;

        // Show the latest 10 records (if available)
        const recentCards = goalData.dailyCards.slice(-10).reverse(); // Latest 10, newest first
        
        recentCards.forEach((card, index) => {
          if (yPosition > pdfHeight - 60) {
            pdf.addPage();
            yPosition = pdfMargin;
            
            // Redraw table header on new page
            pdf.setFillColor(220, 220, 220);
            pdf.rect(pdfMargin, yPosition, contentWidth, rowHeight, 'F');
            pdf.setFont("helvetica", "bold");
            pdf.text("Date", pdfMargin + 10, yPosition + 20);
            pdf.text("Daily Task", pdfMargin + dateWidth + 10, yPosition + 20);
            pdf.text("Completed", pdfMargin + dateWidth + taskWidth + 10, yPosition + 20);
            pdf.text("Records", pdfMargin + dateWidth + taskWidth + statusWidth + 10, yPosition + 20);
            pdf.setFont("helvetica", "normal");
            yPosition += rowHeight;
          }
          
          // Draw table row
          if (index % 2 === 0) {
            pdf.setFillColor(248, 248, 248);
            pdf.rect(pdfMargin, yPosition, contentWidth, rowHeight, 'F');
          }
          
          pdf.rect(pdfMargin, yPosition, contentWidth, rowHeight);
          
          // Date column
          pdf.text(new Date(card.date).toLocaleDateString(), pdfMargin + 10, yPosition + 20);
          
          // Task column (with text wrapping if needed)
          const dailyTaskText = card.dailyTask || "None";
          const taskLines = pdf.splitTextToSize(dailyTaskText, taskWidth - 10);
          pdf.text(taskLines, pdfMargin + dateWidth + 10, yPosition + 20);
          
          // Status column 
          const isCompleted = card.completed && card.completed.dailyTask === true;
          pdf.text(isCompleted ? "Yes" : "No", pdfMargin + dateWidth + taskWidth + 10, yPosition + 20);
          
          // Records column
          const recordsCount = card.records ? card.records.length : 0;
          pdf.text(recordsCount.toString(), pdfMargin + dateWidth + taskWidth + statusWidth + 10, yPosition + 20);
          
          yPosition += rowHeight;
        });
      }

      // Check if there's a vision image, if so add to new page
      if (goalData.visionImageUrl) {
        pdf.addPage();
        yPosition = pdfMargin;
        
        pdf.setFontSize(16);
        pdf.setTextColor(0, 102, 204);
        pdf.text(`${sectionIndex + 6}. Vision Image`, pdfMargin, yPosition);
        yPosition += 30;
        
        try {
          const img = new Image();
          img.crossOrigin = "Anonymous";  // Handle CORS issues
          
          // Use Promise to wait for image loading
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = goalData.visionImageUrl;
          });
          
          // Calculate image dimensions to fit page width
          const imgWidth = contentWidth;
          const imgHeight = (img.height * imgWidth) / img.width;
          
          // Check if image height exceeds remaining page space
          if (imgHeight > pdfHeight - yPosition - 40) {
            const scaleFactor = (pdfHeight - yPosition - 40) / imgHeight;
            const adjustedWidth = imgWidth * scaleFactor;
            const adjustedHeight = imgHeight * scaleFactor;
            pdf.addImage(img, 'JPEG', pdfMargin, yPosition, adjustedWidth, adjustedHeight);
          } else {
            pdf.addImage(img, 'JPEG', pdfMargin, yPosition, imgWidth, imgHeight);
          }
          
        } catch (err) {
          console.error("Failed to add vision image:", err);
          pdf.setTextColor(255, 0, 0);
          pdf.text("Failed to add vision image", pdfMargin, yPosition);
          pdf.setTextColor(0, 0, 0);
        }
      }

      // Get declaration content directly without opening dialog
      const declarationContent = getDeclarationContent(goalData);
      
      // Add declaration section (if exists)
      if (declarationContent) {
        pdf.addPage();
        yPosition = pdfMargin;
        
        pdf.setFontSize(16);
        pdf.setTextColor(0, 102, 204);
        pdf.text(`${sectionIndex + 7}. Goal Declaration`, pdfMargin, yPosition);
        yPosition += 20;
        
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        
        const declarationText = pdf.splitTextToSize(declarationContent, contentWidth);
        pdf.text(declarationText, pdfMargin, yPosition);
      }

      // Add footer
      const pageCount = pdf.internal.getNumberOfPages();
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.text(
          `Generated on: ${new Date().toLocaleString()} - Page ${i} of ${pageCount}`,
          pdfWidth / 2,
          pdf.internal.pageSize.getHeight() - 20,
          { align: 'center' }
        );
      }
      
      // Save PDF with consistent file naming
      const safeFileName = goalData.title.replace(/[^\w\s-]/gi, '').trim() || "Goal";
      pdf.save(`${safeFileName}-Progress-Report.pdf`);
      console.log("PDF report successfully generated");
      
      // Store export timestamp in report store
      if (reportData) {
        setReport(goalId, {
          ...reportData,
          lastExportedAt: new Date().toISOString()
        });
      }
      
    } catch (err) {
      console.error("Error during PDF export:", err);
      alert("Failed to export PDF. Please check console for details.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      variant="contained"
      color="success"
      startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
      onClick={handleExport}
      disabled={exporting || !goalId}
      sx={{ 
        mb: 3,
        width: '100%',
        maxWidth: { sm: '200px' },
        display: 'block',
        mx: 'auto',
        backgroundColor: '#4CD7D0',
        border: '2px solid #0D5E6D',
        '&:hover': {
          backgroundColor: '#3AC0B9'
        }
      }}
    >
      {exporting ? 'Exporting...' : 'Export Report'}
    </Button>
  );
}
