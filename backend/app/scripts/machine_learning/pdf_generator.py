import os
import io
from datetime import datetime
from typing import Dict, List, Any
from fastapi import HTTPException
from fastapi.responses import StreamingResponse
import matplotlib
import matplotlib.pyplot as plt
matplotlib.use('Agg')  # Use non-interactive backend for server usage
import seaborn as sns
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak, ListFlowable, ListItem
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.legends import Legend

def generate_study_plan_pdf(
    student_id: int,
    student_name: str,
    study_plan_data: Dict[str, Any]
) -> StreamingResponse:
    """
    Generates a PDF of the study plan for the student to download or print.
    
    Args:
        student_id: The student's ID
        student_name: The student's name for the report
        study_plan_data: The study plan data including events and summary
        
    Returns:
        StreamingResponse containing the PDF file
    """
    # Extract plan details
    plan = study_plan_data.get("plan", {})
    summary = study_plan_data.get("summary", {})
    events = plan.get("events", [])
    
    # Check if there's enough data to generate a PDF
    if not events:
        raise HTTPException(
            status_code=400, 
            detail="No study events found in the plan"
        )
    
    # Create a buffer for the PDF
    buffer = io.BytesIO()
    
    # Create the PDF document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72,
        title=f"USMLE Step 1 Study Plan - {student_name}"
    )
    
    # Styles for the document
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name='Center',
        parent=styles['Heading2'],
        alignment=TA_CENTER
    ))
    styles.add(ParagraphStyle(
        name='Normal_CENTER',
        parent=styles['Normal'],
        alignment=TA_CENTER
    ))
    styles.add(ParagraphStyle(
        name='Normal_RIGHT',
        parent=styles['Normal'],
        alignment=TA_RIGHT
    ))
    
    # Elements to add to the PDF
    elements = []
    
    # Title
    elements.append(Paragraph(
        f"USMLE Step 1 Study Plan", 
        styles['Heading1']
    ))
    elements.append(Spacer(1, 12))
    
    # Student info and dates
    elements.append(Paragraph(
        f"Prepared for: {student_name}", 
        styles['Normal']
    ))
    elements.append(Paragraph(
        f"Created on: {datetime.now().strftime('%B %d, %Y')}", 
        styles['Normal']
    ))
    elements.append(Spacer(1, 12))
    
    # Plan details
    start_date = datetime.fromisoformat(plan.get("startDate", "").replace("Z", "+00:00"))
    end_date = datetime.fromisoformat(plan.get("examDate", "").replace("Z", "+00:00"))
    days_until_exam = (end_date - start_date).days
    
    elements.append(Paragraph("Plan Details:", styles['Heading2']))
    elements.append(Paragraph(
        f"Exam Date: {end_date.strftime('%B %d, %Y')}", 
        styles['Normal']
    ))
    elements.append(Paragraph(
        f"Days Until Exam: {days_until_exam}", 
        styles['Normal']
    ))
    elements.append(Paragraph(
        f"Total Study Hours: {summary.get('total_study_hours', 0)}", 
        styles['Normal']
    ))
    elements.append(Spacer(1, 12))
    
    # Summary Statistics
    elements.append(Paragraph("Study Plan Summary:", styles['Heading2']))
    elements.append(Spacer(1, 6))
    
    # Create a bar chart for weekly breakdown
    weekly_breakdown = summary.get("weekly_breakdown", {})
    if weekly_breakdown:
        # Generate chart in memory
        plt.figure(figsize=(6, 3))
        sns.barplot(
            x=list(weekly_breakdown.keys()),
            y=list(weekly_breakdown.values()),
            palette="Blues_d"
        )
        plt.title("Study Hours by Week")
        plt.xlabel("Week")
        plt.ylabel("Hours")
        plt.tight_layout()
        
        # Save to a buffer
        img_data = io.BytesIO()
        plt.savefig(img_data, format='png')
        img_data.seek(0)
        plt.close()
        
        # Add to PDF
        img = Image(img_data, width=400, height=200)
        elements.append(img)
        elements.append(Spacer(1, 12))
    
    # Create a pie chart for focus areas
    focus_areas = summary.get("focus_areas", {})
    if focus_areas:
        # Generate chart in memory
        plt.figure(figsize=(6, 4))
        plt.pie(
            list(focus_areas.values()), 
            labels=list(focus_areas.keys()),
            autopct='%1.1f%%',
            startangle=90
        )
        plt.axis('equal')  # Equal aspect ratio ensures that pie is drawn as a circle
        plt.title("Study Time by Subject")
        plt.tight_layout()
        
        # Save to a buffer
        img_data = io.BytesIO()
        plt.savefig(img_data, format='png')
        img_data.seek(0)
        plt.close()
        
        # Add to PDF
        img = Image(img_data, width=350, height=250)
        elements.append(img)
    
    elements.append(PageBreak())
    
    # Study Schedule
    elements.append(Paragraph("Study Schedule:", styles['Heading2']))
    elements.append(Spacer(1, 12))
    
    # Organize events by date
    organized_events = {}
    for event in events:
        start_time = datetime.fromisoformat(event.get("start", "").replace("Z", "+00:00"))
        date_key = start_time.strftime("%Y-%m-%d")
        if date_key not in organized_events:
            organized_events[date_key] = []
        organized_events[date_key].append(event)
    
    # Sort dates
    sorted_dates = sorted(organized_events.keys())
    
    # Create tables for each date
    for date_key in sorted_dates:
        date_events = organized_events[date_key]
        date_obj = datetime.strptime(date_key, "%Y-%m-%d")
        
        elements.append(Paragraph(
            f"Date: {date_obj.strftime('%A, %B %d, %Y')}", 
            styles['Heading3']
        ))
        elements.append(Spacer(1, 6))
        
        # Create table data
        data = [["Time", "Topic", "Description"]]
        for event in date_events:
            start_time = datetime.fromisoformat(event.get("start", "").replace("Z", "+00:00"))
            end_time = datetime.fromisoformat(event.get("end", "").replace("Z", "+00:00"))
            time_str = f"{start_time.strftime('%I:%M %p')} - {end_time.strftime('%I:%M %p')}"
            
            topic = event.get("topicName", "")
            title = event.get("title", "")
            description = event.get("description", "")
            
            # Add row to table
            data.append([
                time_str,
                title,
                description
            ])
        
        # Create table
        table = Table(data, colWidths=[100, 120, 220])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BOX', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        elements.append(table)
        elements.append(Spacer(1, 12))
    
    # Study Tips
    elements.append(PageBreak())
    elements.append(Paragraph("Study Tips for USMLE Step 1:", styles['Heading2']))
    elements.append(Spacer(1, 12))
    
    tips = [
        "Use spaced repetition for efficient long-term retention",
        "Focus on understanding concepts rather than memorization",
        "Take regular breaks (e.g., Pomodoro technique: 25 min study + 5 min break)",
        "Practice with timed questions to build test-taking skills",
        "Review high-yield topics frequently",
        "Create and use flashcards for rapid review",
        "Maintain a healthy sleep schedule and exercise routine",
        "Form study groups for difficult topics",
        "Take full-length practice exams under test-like conditions",
        "Focus on your identified weak areas while maintaining strength areas"
    ]
    
    tip_items = []
    for tip in tips:
        tip_items.append(ListItem(Paragraph(tip, styles['Normal'])))
    
    elements.append(ListFlowable(
        tip_items,
        bulletType='bullet',
        leftIndent=20,
        bulletFontName='Helvetica',
        bulletFontSize=10
    ))
    
    # Build the document
    doc.build(elements)
    
    # Get the value of the BytesIO buffer
    buffer.seek(0)
    
    # Return the PDF as a streaming response
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=USMLE_Study_Plan_{student_id}.pdf"
        }
    )