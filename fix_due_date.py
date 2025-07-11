﻿# Fix for robust due date parsing in simple_routes.py
# This script updates the due_date parsing logic to handle multiple date formats

import fileinput
import sys

# Read the file
with open('routers/simple_routes.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the due_date parsing section
old_code = '''        if due_date is not None:
            # Validate due_date is today or future
            from datetime import datetime, date
            try:
                # Parse the date string
                if isinstance(due_date, str):
                    # Handle ISO format (YYYY-MM-DD)
                    due_date_obj = datetime.strptime(due_date, "%Y-%m-%d").date()
                else:
                    due_date_obj = due_date
                
                today = date.today()
                if due_date_obj < today:
                    raise HTTPException(status_code=400, detail="Due date cannot be in the past")
                
                # Format for MySQL DATE column - use DATE() function to ensure proper conversion
                update_fields.append("due_date = DATE(:due_date)")
                update_params["due_date"] = due_date_obj.strftime("%Y-%m-%d")
                print(f" DEBUG: Due date formatted for MySQL: {update_params['due_date']}")
            except ValueError as e:
                print(f" DEBUG: Date parsing error: {e}")
                raise HTTPException(status_code=400, detail=f"Invalid due date format: {due_date}. Expected YYYY-MM-DD")'''

new_code = '''        if due_date is not None:
            # Handle null/empty due_date
            if due_date == "" or due_date == "null" or due_date is None:
                update_fields.append("due_date = NULL")
                print(f" DEBUG: Setting due_date to NULL")
            else:
                # Validate due_date is today or future
                from datetime import datetime, date
                from dateutil import parser as date_parser
                
                try:
                    # More flexible date parsing
                    if isinstance(due_date, str):
                        # Clean the date string first
                        due_date_clean = due_date.strip()
                        
                        # Handle different date formats
                        due_date_obj = None
                        
                        # Try common formats first
                        for fmt in ["%Y-%m-%d", "%Y/%m/%d", "%d-%m-%Y", "%d/%m/%Y"]:
                            try:
                                due_date_obj = datetime.strptime(due_date_clean, fmt).date()
                                break
                            except ValueError:
                                continue
                        
                        # If common formats fail, handle ISO format with time
                        if not due_date_obj:
                            if 'T' in due_date_clean:
                                # ISO format like "2025-01-15T00:00:00.000Z"
                                due_date_clean = due_date_clean.split('T')[0]
                                due_date_obj = datetime.strptime(due_date_clean, "%Y-%m-%d").date()
                            else:
                                # Fall back to dateutil parser for maximum flexibility
                                due_date_obj = date_parser.parse(due_date_clean).date()
                    else:
                        due_date_obj = due_date
                    
                    # Validate date is not in the past
                    today = date.today()
                    if due_date_obj < today:
                        raise HTTPException(status_code=400, detail="Due date cannot be in the past")
                    
                    # Format for MySQL DATE column
                    update_fields.append("due_date = DATE(:due_date)")
                    update_params["due_date"] = due_date_obj.strftime("%Y-%m-%d")
                    print(f" DEBUG: Due date formatted for MySQL: {update_params['due_date']} (from input: {due_date})")
                    
                except Exception as e:
                    print(f" DEBUG: Date parsing error: {e} (input was: {due_date})")
                    raise HTTPException(status_code=400, detail=f"Invalid due date format: {due_date}. Please use YYYY-MM-DD format.")'''

# Replace the code
if old_code in content:
    content = content.replace(old_code, new_code)
    print(" Successfully updated due_date parsing logic")
else:
    print(" Could not find the exact code to replace")
    print("Attempting partial match...")
    # Try a more flexible approach
    import re
    pattern = r'if due_date is not None:.*?raise HTTPException\(status_code=400, detail=f"Invalid due date format:.*?\)'
    if re.search(pattern, content, re.DOTALL):
        print("Found pattern match")

# Write the updated content back
with open('routers/simple_routes.py', 'w', encoding='utf-8') as f:
    f.write(content)

print(" File updated successfully")
