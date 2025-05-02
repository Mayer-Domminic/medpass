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
from reportlab.lib import colors as reportlab_colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak, ListFlowable, ListItem

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
        rightMargin=0.5*inch,
        leftMargin=0.5*inch,
        topMargin=0.5*inch,
        bottomMargin=0.5*inch,
        title=f"USMLE Step 1 Study Plan - {student_name}"
    )
    
    # Styles for the document
    styles = getSampleStyleSheet()
    
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
    elements.append(Spacer(1, 6))
    
    plan_details_data = [
        ["Exam Date", "Days Until Exam", "Total Study Hours"],
        [
            end_date.strftime('%B %d, %Y'),
            str(days_until_exam),
            str(summary.get('total_study_hours', 0))
        ]
    ]
    
    plan_details_table = Table(plan_details_data, colWidths=[doc.width/3.0]*3)
    plan_details_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), reportlab_colors.lightblue),
        ('TEXTCOLOR', (0, 0), (-1, 0), reportlab_colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('ALIGN', (0, 1), (-1, 1), 'CENTER'),
        ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 1), (-1, 1), 14),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, reportlab_colors.grey),
    ]))
    
    elements.append(plan_details_table)
    elements.append(Spacer(1, 12))
    
    # Summary Statistics
    elements.append(Paragraph("Study Plan Summary:", styles['Heading2']))
    elements.append(Spacer(1, 6))
    
    # Create a bar chart for weekly breakdown
    weekly_breakdown = summary.get("weekly_breakdown", {})
    if weekly_breakdown:
        weeks_data = []
        for week_key, hours in weekly_breakdown.items():
            try:
                week_num = int(week_key.replace("Week ", ""))
                weeks_data.append((week_num, hours))
            except ValueError:
                continue
        
        weeks_data.sort(key=lambda x: x[0])
        
        if len(weeks_data) > 6:
            initial_weeks = weeks_data[:5]
            other_weeks_sum = sum(h for _, h in weeks_data[5:])
            simplified_weeks_data = initial_weeks + [(6, other_weeks_sum)]
            weeks_data = simplified_weeks_data
            
        plt.figure(figsize=(6, 3))
        
        ax = sns.barplot(
            x=[f"Week {w[0]}" for w in weeks_data],
            y=[w[1] for w in weeks_data],
            palette="Blues_d"
        )
        
        for i, v in enumerate([w[1] for w in weeks_data]):
            ax.text(i, v + 0.5, str(round(v)), ha='center')
            
        plt.title("Study Hours by Week", fontsize=14, fontweight='bold')
        plt.xlabel("Week", fontsize=12)
        plt.ylabel("Hours", fontsize=12)
        plt.ylim(0, max([w[1] for w in weeks_data]) * 1.2)
        plt.tight_layout()
        
        # Save to a buffer
        img_data = io.BytesIO()
        plt.savefig(img_data, format='png', dpi=300)
        img_data.seek(0)
        plt.close()
        
        # Add to PDF
        img = Image(img_data, width=4.5*inch, height=2.5*inch)
        elements.append(img)
        elements.append(Spacer(1, 12))
    
    # Create a pie chart for focus areas
    focus_areas = summary.get("focus_areas", {})
    if focus_areas:
        subjects_data = []
        for subject, hours in focus_areas.items():
            subjects_data.append((subject, hours))
        
        subjects_data.sort(key=lambda x: x[1], reverse=True)
        top_subjects = subjects_data[:5]
        
        total_hours = sum(hours for _, hours in top_subjects)
        
        plt.figure(figsize=(6, 4))
        
        chart_colors = ['#4299e1', '#2b6cb0', '#3182ce', '#2c5282', '#1a365d']
        wedges, texts, autotexts = plt.pie(
            [hours for _, hours in top_subjects],
            labels=[subject for subject, _ in top_subjects],
            autopct='%1.1f%%',
            startangle=90,
            colors=chart_colors,
            wedgeprops={'edgecolor': 'w', 'linewidth': 1}
        )
        
        for text in texts:
            text.set_fontsize(10)
        for autotext in autotexts:
            autotext.set_fontsize(9)
            autotext.set_color('white')
            
        plt.axis('equal')  # Equal aspect ratio ensures that pie is drawn as a circle
        plt.title("Study Time by Subject (Top 5)", fontsize=14, fontweight='bold')
        plt.tight_layout()
        
        # Save to a buffer
        img_data = io.BytesIO()
        plt.savefig(img_data, format='png', dpi=300)
        img_data.seek(0)
        plt.close()
        
        # Add to PDF
        img = Image(img_data, width=4*inch, height=3*inch)
        elements.append(img)
    
    elements.append(PageBreak())
    
    # Study Schedule
    elements.append(Paragraph("Study Schedule:", styles['Heading2']))
    elements.append(Spacer(1, 12))
    
    # Organize events by date
    organized_events = {}
    for event in events:
        try:
            start_time = datetime.fromisoformat(event.get("start", "").replace("Z", "+00:00"))
            date_key = start_time.strftime("%Y-%m-%d")
            if date_key not in organized_events:
                organized_events[date_key] = []
            organized_events[date_key].append(event)
        except (ValueError, TypeError):
            continue
    
    # Sort dates
    sorted_dates = sorted(organized_events.keys())
    
    # Create tables for each date
    days_shown = 0
    for date_key in sorted_dates:
        if days_shown >= 14:
            elements.append(Paragraph(
                f"... and {len(sorted_dates) - days_shown} more days", 
                styles['Normal']
            ))
            break
            
        date_events = organized_events[date_key]
        date_obj = datetime.strptime(date_key, "%Y-%m-%d")
        
        elements.append(Paragraph(
            f"Date: {date_obj.strftime('%A, %B %d, %Y')}", 
            styles['Heading3']
        ))
        elements.append(Spacer(1, 6))
        
        data = []
        data.append(["Time", "Topic", "Description"])
        
        for event in date_events:
            start_time = datetime.fromisoformat(event.get("start", "").replace("Z", "+00:00"))
            end_time = datetime.fromisoformat(event.get("end", "").replace("Z", "+00:00"))
            time_str = f"{start_time.strftime('%I:%M %p')} - {end_time.strftime('%I:%M %p')}"
            
            topic = event.get("topicName", "")
            title = event.get("title", "")
            
            description = event.get("description", "")
            if len(description) > 500:  
                description = description[:500] + "..."
                
            description_para = Paragraph(description, styles['Normal'])
            
            # Add row to table
            data.append([
                time_str,
                topic or title,
                description_para
            ])
        
        time_col = 1.5 * inch
        topic_col = 1.5 * inch
        desc_col = doc.width - time_col - topic_col - 12  
        
        # Create table
        table = Table(data, colWidths=[time_col, topic_col, desc_col])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), reportlab_colors.lightblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), reportlab_colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), reportlab_colors.beige),
            ('TEXTCOLOR', (0, 1), (-1, -1), reportlab_colors.black),
            ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 1, reportlab_colors.black),
            ('BOX', (0, 0), (-1, -1), 1, reportlab_colors.black),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('ROWHEIGHTS', (0, 1), (-1, -1), 'AUTO'),
        ]))
        
        elements.append(table)
        elements.append(Spacer(1, 12))
        days_shown += 1
        
        if days_shown % 3 == 0 and days_shown < len(sorted_dates):
            elements.append(PageBreak())
            elements.append(Paragraph("Study Schedule (continued):", styles['Heading2']))
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