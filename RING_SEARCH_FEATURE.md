# Ring Number Search Feature

## Overview
The Ring Number Search feature allows you to search for a specific pigeon across all races and view its complete racing history.

## How to Use

### 1. Open Ring Search
- Click the **"Search Ring History"** button in the controls section (pink/purple gradient button)
- Or use the search icon next to the regular search box

### 2. Enter Ring Number
- Type the ring number in the search field (e.g., "24-52228-h")
- The search is case-insensitive and supports partial matches
- Press Enter or click the "Search" button

### 3. View Results
The search will display:

#### Pigeon Summary Card
- **Ring Number**: The pigeon's identification
- **Loft Name**: Owner's loft
- **Culture**: Pigeon's color/type
- **Total Races**: Number of races participated in
- **Completed**: Races where the pigeon returned
- **Best Position**: Highest ranking achieved
- **Average Position**: Mean position across all completed races
- **Top 3 Finishes**: Number of times in top 3
- **Top 10 Finishes**: Number of times in top 10
- **Average Velocity**: Mean speed in YPM (Yards Per Minute)
- **Club**: Racing club affiliation

#### Race History Table
Shows all races the pigeon participated in, sorted by date (most recent first):
- **Position**: Ranking with color-coded badges
  - 🥇 Gold: 1st place
  - 🥈 Silver: 2nd place
  - 🥉 Bronze: 3rd place
  - 💜 Purple: Top 10
  - ⚪ Gray: Other positions
- **Race Name**: Name of the race
- **Date**: When the race occurred
- **Location**: Race location
- **Distance**: Race distance in kilometers
- **Trapping Time**: When the pigeon arrived
- **Total Time**: Total flight time
- **Velocity**: Speed in YPM

## Features

### Search Capabilities
- ✅ Search across ALL races in the database
- ✅ Case-insensitive search
- ✅ Partial match support (search "24-52" to find all pigeons with that prefix)
- ✅ Multiple results if partial match finds several pigeons

### Statistics Calculated
- Total participation count
- Completion rate
- Best and average positions
- Top finishes tracking
- Average velocity across all races

### Visual Indicators
- Color-coded position badges
- Culture badges matching the main table
- Highlighted velocity values
- Professional gradient design

## Use Cases

1. **Track Individual Pigeon Performance**
   - See how a specific pigeon performs across different races
   - Identify consistent performers

2. **Compare Race Results**
   - View all races a pigeon participated in
   - Analyze performance trends

3. **Breeding Decisions**
   - Identify top-performing pigeons for breeding
   - Track genetic lines through ring numbers

4. **Historical Records**
   - Maintain complete racing history
   - Document pigeon achievements

## Technical Details

### Data Source
- Searches through all races stored in Firebase or local storage
- Real-time data from the current database
- No additional data storage required

### Performance
- Instant search across all races
- Efficient filtering and grouping
- Responsive design for all screen sizes

## Tips

- Use partial ring numbers to find multiple pigeons from the same batch
- The search works even if you don't remember the exact format
- Results are automatically sorted by date (newest first)
- All statistics are calculated in real-time from actual race data

## Keyboard Shortcuts
- **Enter**: Execute search when in the ring number input field
- **Escape**: Close the search modal

## Browser Compatibility
Works on all modern browsers:
- Chrome/Edge
- Firefox
- Safari
- Mobile browsers
