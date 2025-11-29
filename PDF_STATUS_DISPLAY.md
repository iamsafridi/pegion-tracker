# PDF Status Display Guide

## Overview
The PDF now includes a **Status** column that clearly shows whether each pigeon returned, is missing, or is still registered.

## PDF Layout

### Header Section
```
┌─────────────────────────────────────────────────────────────┐
│  [LOGO]  CHAPAINAWABGANJ RACING PIGEON ASSOCIATION          │
│          Since 2023 - Professional Pigeon Racing...         │
│                                                              │
│  Release Time: 08:05:00 AM    [RACE NAME BADGE]            │
│  Returned P: 200               2024-2025                    │
│  Missing P: 20                                              │
│                                                              │
│                                  Date: 31TH JANUARY 2025    │
│                                  Visibility: FOGGY          │
│                                  Registered Pigeon: 220     │
└─────────────────────────────────────────────────────────────┘
```

### Table Columns
The PDF table now includes 14 columns:

1. **POSITION** - Dark gray background, white text
2. **S/L** - Serial number
3. **Loft's Name** - Color-coded by loft
4. **Ban Ring No** - Ring number
5. **Culture** - Color-coded culture badge
6. **Distance (KM)** - Race distance
7. **Release Time** - Start time
8. **Trapping Time** - Arrival time (or --:--:--)
9. **Status** - 🆕 NEW COLUMN (color-coded)
10. **Total Time** - Flight duration
11. **Second** - Total seconds
12. **Minute** - Total minutes
13. **Velocity (YPM)** - Speed
14. **Club Name** - Club affiliation

## Status Column Display

### Visual Indicators

#### 1. Returned ✓
- **Background**: Light green (#C6F6D5)
- **Text**: Dark green (#228B22)
- **Style**: Bold
- **Display**: "Returned"
- **Meaning**: Pigeon came back successfully

#### 2. Missing ✗
- **Background**: Light red (#FED7D7)
- **Text**: Dark red (#C53030)
- **Style**: Bold
- **Display**: "Missing"
- **Meaning**: Pigeon didn't return

#### 3. Registered
- **Background**: Light gray (#F7FAFC)
- **Text**: Medium gray (#718096)
- **Style**: Italic
- **Display**: "Registered"
- **Meaning**: Not yet returned (race in progress)

## Example PDF Table

```
┌──────────┬─────┬──────────────┬─────────────┬─────────┬──────────┬─────────┬──────────┬───────────┬──────────┬────────┬────────┬──────────┬──────┐
│ POSITION │ S/L │ Loft's Name  │ Ban Ring No │ Culture │ Distance │ Release │ Trapping │  Status   │   Total  │ Second │ Minute │ Velocity │ Club │
│          │     │              │             │         │   (KM)   │  Time   │   Time   │           │   Time   │        │        │  (YPM)   │ Name │
├──────────┼─────┼──────────────┼─────────────┼─────────┼──────────┼─────────┼──────────┼───────────┼──────────┼────────┼────────┼──────────┼──────┤
│    1     │  1  │ Samad Loft   │ 24-52228-h  │  blue   │  70.35   │ 08:05   │ 08:56:50 │ Returned  │ 0:51:50  │  3110  │   52   │ 1484.29  │CNRPA │
│          │     │              │             │         │          │         │          │  (GREEN)  │          │        │        │          │      │
├──────────┼─────┼──────────────┼─────────────┼─────────┼──────────┼─────────┼──────────┼───────────┼──────────┼────────┼────────┼──────────┼──────┤
│    2     │  2  │ Samad Loft   │ 24-52305-c  │ rchek   │  70.35   │ 08:05   │ 08:56:53 │ Returned  │ 0:51:53  │  3113  │   52   │ 1482.86  │CNRPA │
│          │     │              │             │         │          │         │          │  (GREEN)  │          │        │        │          │      │
├──────────┼─────┼──────────────┼─────────────┼─────────┼──────────┼─────────┼──────────┼───────────┼──────────┼────────┼────────┼──────────┼──────┤
│   150    │ 150 │ Test Loft    │ 24-99999-x  │  white  │  70.35   │ 08:05   │ --:--:-- │  Missing  │ --:--:-- │    0   │    0   │    --    │CNRPA │
│          │     │              │             │         │          │         │          │   (RED)   │          │        │        │          │      │
└──────────┴─────┴──────────────┴─────────────┴─────────┴──────────┴─────────┴──────────┴───────────┴──────────┴────────┴────────┴──────────┴──────┘
```

## Color Coding Summary

### Status Colors
| Status      | Background | Text Color | Style  | Use Case                    |
|-------------|------------|------------|--------|-----------------------------|
| Returned    | 🟢 Green   | Dark Green | Bold   | Pigeon came back            |
| Missing     | 🔴 Red     | Dark Red   | Bold   | Pigeon didn't return        |
| Registered  | ⚪ Gray    | Gray       | Italic | Race in progress/not marked |

### Other Column Colors
- **Position**: Dark gray background (always)
- **Culture**: Color-coded by culture type
- **Loft Name**: Color-coded by loft (10 colors)

## Header Statistics

The PDF header shows:
- **Returned P**: Count of pigeons with "Returned" status
- **Missing P**: Count of pigeons with "Missing" status  
- **Registered Pigeon**: Total count (all pigeons)

### Example:
```
Returned P: 200
Missing P: 20
Registered Pigeon: 220
```

This means:
- 220 total pigeons registered
- 200 returned successfully (90.9% return rate)
- 20 are missing (9.1% loss rate)

## Benefits

✅ **Clear Visual**: Easy to spot returned vs missing pigeons
✅ **Color Coded**: Green = good, Red = missing, Gray = pending
✅ **Professional**: Matches the overall PDF design
✅ **Printable**: Colors work well in both color and grayscale printing
✅ **Comprehensive**: All information in one document

## Use Cases

### 1. Race Results
- Share with participants showing who returned
- Official race documentation
- Archive for historical records

### 2. Missing Pigeon Reports
- Quickly identify missing pigeons (red rows)
- Contact owners of missing pigeons
- Insurance documentation

### 3. Performance Analysis
- Compare return rates across races
- Identify patterns (weather, distance, etc.)
- Breeding decisions based on return rates

### 4. Club Records
- Official club documentation
- Year-end summaries
- Trophy/award calculations

## Printing Tips

### Color Printing
- All status colors will be clearly visible
- Green and red provide strong contrast
- Professional appearance

### Grayscale Printing
- Status column still readable
- Bold text for Returned/Missing stands out
- Italic text for Registered is distinguishable

### PDF Settings
- Landscape orientation (better table fit)
- A4 paper size
- Auto-fit columns for optimal spacing

## File Naming
PDFs are automatically named:
```
[Race_Name]_[Date]_Results.pdf
```

Example:
```
JOBAIL_BULL_70KM_2025-01-31_Results.pdf
```

## Summary

The PDF now provides a complete, professional race report with:
- Clear header showing returned vs missing counts
- Color-coded Status column in the table
- All race details and statistics
- Professional formatting and layout
- Easy to read and share

Perfect for official race documentation, sharing with participants, and maintaining historical records!
