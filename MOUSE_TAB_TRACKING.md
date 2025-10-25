# Mouse Pointer & Tab Switching Detection

## Features Added

### 1. **Mouse Out Detection**
- Tracks when student's mouse pointer leaves the exam window
- **Debounced**: Only counts one violation per 3 seconds to prevent spam
- Shows immediate warning notification to student
- Recorded in database with timestamp

### 2. **Tab Switching Detection**
- Tracks when student switches tabs/windows
- **Debounced**: Only counts one violation per 3 seconds
- Shows warning notification when student returns
- Recorded in database with timestamp

## User Experience

### For Students:
1. **Real-time Counters**: Violation counts displayed in sidebar
   - Mouse Out count (orange badge)
   - Tab Switch count (red badge)

2. **Warning Notifications**: Floating notifications appear when violations occur
   - Auto-dismiss after 4 seconds
   - Clear warning messages

3. **Proctoring Sidebar**: Shows live counts during exam
   - Keeps students aware of their behavior
   - Visual feedback with color-coded badges

### For Admins:
1. **Live Monitoring**: See violations in real-time on admin dashboard
2. **Final Results**: View complete violation counts after exam completion
   - Mouse Out count
   - Tab Switch count
3. **Color-coded Metrics**: Easy-to-read cards with distinct colors

## Technical Implementation

### Debouncing Logic
```typescript
- Minimum 3 seconds between counting violations
- 500ms debounce on event handlers
- Prevents rapid-fire counting of same action
```

### Database Schema
```sql
violations table:
  - id
  - session_id
  - roll_no
  - violation_type (mouse_out | tab_switch)
  - timestamp

results table (new columns):
  - mouse_out_count
  - tab_switch_count
```

## Testing

### Test Mouse Out:
1. Start an exam as student
2. Move mouse outside browser window
3. Wait 1 second and see notification
4. Check sidebar counter increases
5. Try moving mouse out rapidly - should only count once per 3 seconds

### Test Tab Switch:
1. Start an exam as student
2. Press Alt+Tab or Cmd+Tab to switch windows
3. Switch back to exam
4. See warning notification
5. Check sidebar counter increases
6. Try switching tabs rapidly - should only count once per 3 seconds

## Migration Required

Run this before starting the updated backend:
```bash
cd backend
python migrate_database.py
```

This adds:
- `violations` table
- `mouse_out_count` column to results
- `tab_switch_count` column to results

## API Endpoints

### POST `/api/submit-violation`
```json
{
  "session_id": "uuid",
  "roll_no": "string",
  "violation_type": "mouse_out" | "tab_switch",
  "timestamp": "ISO8601"
}
```

Response:
```json
{
  "status": "success",
  "message": "Violation recorded"
}
```
