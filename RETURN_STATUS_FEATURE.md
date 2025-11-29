# Return Status Tracking Feature

## Overview
This feature allows you to explicitly track whether each pigeon returned from a race or went missing. This is much better than just relying on whether a trapping time was entered.

## How It Works

### Workflow

#### 1. **Initial Registration** (Before Race)
When registering pigeons before the race:
- Add pigeon details (loft name, ring number, culture, etc.)
- Set **Return Status** to: **"Registered (Not Yet Returned)"**
- Leave trapping time empty
- Save entry

#### 2. **After Race - Pigeon Returns**
When a pigeon comes back:
- Edit the entry
- Change **Return Status** to: **"Returned"**
- Add the **Trapping Time**
- Save entry
- System automatically calculates velocity and position

#### 3. **After Race - Pigeon Missing**
If a pigeon doesn't return:
- Edit the entry
- Change **Return Status** to: **"Not Returned (Missing)"**
- Leave trapping time empty
- Save entry
- Row will be highlighted in light red

## Return Status Options

### 1. Registered (Not Yet Returned)
- **When to use**: Initial registration before race
- **Display**: Gray "Registered" badge
- **Meaning**: Pigeon is entered but race hasn't finished yet

### 2. Returned ✓
- **When to use**: Pigeon came back successfully
- **Display**: Green "✓ Returned" badge
- **Requirement**: Must have trapping time
- **Meaning**: Pigeon completed the race

### 3. Not Returned (Missing) ✗
- **When to use**: Pigeon didn't come back
- **Display**: Red "✗ Missing" badge with light red row background
- **Meaning**: Pigeon is missing/lost

## Visual Indicators

### Table Display
- **Returned**: Green checkmark (✓) badge
- **Missing**: Red X (✗) badge with light red row background
- **Registered**: Gray italic text
- Status shown under trapping time in table

### Stats Display
Shows: **"200 / 220"** meaning:
- 200 = Returned pigeons
- 220 = Total registered pigeons
- Missing = 220 - 200 = 20 pigeons

### Race Header
- **Returned P**: Shows count of returned pigeons
- **Registered Pigeon**: Shows total registered

### PDF Export
- **Returned P**: Count of returned pigeons
- **Missing P**: Count of missing pigeons
- **Registered Pigeon**: Total count

## Example Scenario

### Race Setup
You have a race with 220 pigeons registered.

**Initial State:**
```
220 pigeons - Status: "Registered"
Returned: 0
Missing: 0
```

### After Race Ends
Results come in:
- 200 pigeons returned
- 20 pigeons missing

**Update Process:**
1. For each returned pigeon:
   - Edit entry
   - Set status: "Returned"
   - Add trapping time
   - Save

2. For each missing pigeon:
   - Edit entry
   - Set status: "Not Returned (Missing)"
   - Save

**Final State:**
```
Total Registered: 220
Returned: 200 (green badges)
Missing: 20 (red badges, highlighted rows)
```

## Benefits

✅ **Clear Tracking**: Explicit status for each pigeon
✅ **Visual Indicators**: Easy to spot missing pigeons (red highlights)
✅ **Accurate Stats**: Stats based on actual return status, not just trapping time
✅ **Validation**: System requires trapping time when marking as "Returned"
✅ **Reporting**: PDF shows returned vs missing counts
✅ **Historical Record**: Permanent record of which pigeons didn't return

## Form Validation

The system validates:
- If status is "Returned", trapping time is **required**
- If status is "Not Returned", trapping time should be **empty**
- Alert shown if validation fails

## Statistics Calculation

### Average Time
- Calculated **only** for pigeons with status "Returned"
- Ignores registered and missing pigeons

### Position Ranking
- Only pigeons with status "Returned" get ranked
- Missing pigeons don't affect rankings

### Completion Rate
Display shows: **"200 / 220"**
- Easy to calculate: 200/220 = 90.9% return rate

## Use Cases

### 1. Race Management
- Track which pigeons are still out
- Identify missing pigeons quickly
- Calculate return rates

### 2. Breeding Decisions
- Identify pigeons with good return rates
- Avoid breeding from pigeons that go missing
- Track reliability across multiple races

### 3. Reporting
- Generate reports on missing pigeons
- Notify owners of missing pigeons
- Track patterns (weather, distance, etc.)

### 4. Insurance/Claims
- Document which pigeons didn't return
- Provide evidence for insurance claims
- Historical records

## Technical Details

### Data Structure
Each entry now includes:
```javascript
{
  id: 1,
  loftName: "Example Loft",
  ringNumber: "24-12345-h",
  returnStatus: "returned", // or "registered" or "not_returned"
  trappingTime: "09:30:00", // required if returned
  // ... other fields
}
```

### Status Values
- `"registered"` - Initial state
- `"returned"` - Pigeon came back
- `"not_returned"` - Pigeon missing

## Tips

1. **Register First**: Add all pigeons with "Registered" status before race
2. **Update After**: Update status as results come in
3. **Mark Missing**: Don't forget to mark missing pigeons after race ends
4. **Check Stats**: Use stats to verify all pigeons are accounted for
5. **Visual Check**: Scan for red rows to quickly see missing pigeons

## Future Enhancements (Optional)

- Filter to show only missing pigeons
- Export missing pigeons list
- Send notifications to owners
- Track return rates per loft
- Weather correlation analysis
- Distance vs return rate analysis
