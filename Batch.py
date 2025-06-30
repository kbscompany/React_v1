import streamlit as st
import pandas as pd
import io
import mysql.connector
import decimal  # Add decimal import
import json  # Add for saving session data
from datetime import datetime  # Add for timestamps
from db import get_connection  # Make sure this returns a valid MySQL connection object
from utils.batch_helpers import resolve_subrecipe_ingredients_detailed
from language_support import t, get_current_language, set_language, show_language_selector, apply_rtl_style_if_arabic
from auth import get_current_user_id  # Add for user tracking

def create_batch_session_tables():
    """Create tables for saving and loading batch sessions"""
    conn = get_connection()
    if not conn:
        return False
    
    c = conn.cursor()
    
    try:
        # Create batch_sessions table
        c.execute("""
            CREATE TABLE IF NOT EXISTS batch_sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                session_name VARCHAR(255) NOT NULL,
                created_by INT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                description TEXT,
                total_cost DECIMAL(10,2) DEFAULT 0.00,
                UNIQUE KEY unique_session_name (session_name, created_by)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        
        # Create batch_session_items table
        c.execute("""
            CREATE TABLE IF NOT EXISTS batch_session_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                session_id INT NOT NULL,
                cake_id INT NOT NULL,
                quantity DECIMAL(10,5) NOT NULL,
                FOREIGN KEY (session_id) REFERENCES batch_sessions(id) ON DELETE CASCADE,
                FOREIGN KEY (cake_id) REFERENCES cakes(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        
        conn.commit()
        return True
        
    except Exception as e:
        print(f"Error creating batch session tables: {e}")
        conn.rollback()
        return False
    finally:
        c.close()
        conn.close()

def save_batch_session(session_name, description, cake_quantities, total_cost, user_id):
    """Save current batch session to database"""
    conn = get_connection()
    if not conn:
        return False, "Database connection failed"
    
    c = conn.cursor()
    
    try:
        # Check if session name already exists for this user
        c.execute("""
            SELECT id FROM batch_sessions 
            WHERE session_name = %s AND created_by = %s
        """, (session_name, user_id))
        
        existing_session = c.fetchone()
        
        if existing_session:
            # Update existing session
            session_id = existing_session[0]
            c.execute("""
                UPDATE batch_sessions 
                SET description = %s, total_cost = %s, updated_at = NOW()
                WHERE id = %s
            """, (description, total_cost, session_id))
            
            # Delete existing items
            c.execute("DELETE FROM batch_session_items WHERE session_id = %s", (session_id,))
        else:
            # Create new session
            c.execute("""
                INSERT INTO batch_sessions (session_name, created_by, description, total_cost)
                VALUES (%s, %s, %s, %s)
            """, (session_name, user_id, description, total_cost))
            session_id = c.lastrowid
        
        # Insert session items
        for cake_id, quantity in cake_quantities.items():
            if quantity > 0:  # Only save items with quantity > 0
                c.execute("""
                    INSERT INTO batch_session_items (session_id, cake_id, quantity)
                    VALUES (%s, %s, %s)
                """, (session_id, cake_id, quantity))
        
        conn.commit()
        return True, "Session saved successfully"
        
    except Exception as e:
        conn.rollback()
        return False, f"Error saving session: {str(e)}"
    finally:
        c.close()
        conn.close()

def load_batch_session(session_id):
    """Load batch session from database"""
    conn = get_connection()
    if not conn:
        return None, "Database connection failed"
    
    c = conn.cursor()
    
    try:
        # Get session info
        c.execute("""
            SELECT session_name, description, total_cost, created_at, updated_at
            FROM batch_sessions WHERE id = %s
        """, (session_id,))
        
        session_info = c.fetchone()
        if not session_info:
            return None, "Session not found"
        
        # Get session items
        c.execute("""
            SELECT bsi.cake_id, bsi.quantity, c.name
            FROM batch_session_items bsi
            JOIN cakes c ON bsi.cake_id = c.id
            WHERE bsi.session_id = %s
        """, (session_id,))
        
        items = c.fetchall()
        
        return {
            'info': {
                'name': session_info[0],
                'description': session_info[1],
                'total_cost': float(session_info[2]) if session_info[2] else 0.0,
                'created_at': session_info[3],
                'updated_at': session_info[4]
            },
            'items': {cake_id: float(quantity) for cake_id, quantity, cake_name in items}
        }, "Session loaded successfully"
        
    except Exception as e:
        return None, f"Error loading session: {str(e)}"
    finally:
        c.close()
        conn.close()

def get_user_batch_sessions(user_id):
    """Get all batch sessions for a user"""
    conn = get_connection()
    if not conn:
        return []
    
    c = conn.cursor()
    
    try:
        c.execute("""
            SELECT id, session_name, description, total_cost, created_at, updated_at,
                   (SELECT COUNT(*) FROM batch_session_items WHERE session_id = batch_sessions.id) as item_count
            FROM batch_sessions 
            WHERE created_by = %s 
            ORDER BY updated_at DESC
        """, (user_id,))
        
        return c.fetchall()
        
    except Exception as e:
        print(f"Error getting user sessions: {e}")
        return []
    finally:
        c.close()
        conn.close()

def delete_batch_session(session_id, user_id):
    """Delete a batch session"""
    conn = get_connection()
    if not conn:
        return False, "Database connection failed"
    
    c = conn.cursor()
    
    try:
        # Verify ownership
        c.execute("""
            SELECT id FROM batch_sessions 
            WHERE id = %s AND created_by = %s
        """, (session_id, user_id))
        
        if not c.fetchone():
            return False, "Session not found or access denied"
        
        # Delete session (items will be deleted automatically due to CASCADE)
        c.execute("DELETE FROM batch_sessions WHERE id = %s", (session_id,))
        conn.commit()
        
        return True, "Session deleted successfully"
        
    except Exception as e:
        conn.rollback()
        return False, f"Error deleting session: {str(e)}"
    finally:
        c.close()
        conn.close()

def batch_production():
    show_language_selector()
    apply_rtl_style_if_arabic()
    st.header(t('🧮 حاسبة الإنتاج بالدفعات', '🧮 Batch Production Calculator'))
    
    # Initialize batch session tables
    if 'batch_tables_initialized' not in st.session_state:
        if create_batch_session_tables():
            st.session_state.batch_tables_initialized = True
        else:
            st.error(t("❌ فشل في تهيئة جداول الجلسات", "❌ Failed to initialize session tables"))
    
    # Get current user
    user_id = get_current_user_id()
    if not user_id:
        st.warning(t("🚫 يرجى تسجيل الدخول للوصول إلى هذه الميزة", "🚫 Please log in to access this feature."))
        return
    
    conn = get_connection()
    c = conn.cursor()
    
    # Get cakes list early so it's available throughout the function
    c.execute('SELECT id, name FROM cakes')
    cakes = c.fetchall()
    
    if not cakes:
        st.warning(t('⚠️ لا توجد كيكات متاحة للحساب.', '⚠️ No cakes available to calculate batch.'))
        conn.close()
        return
    
    # Session Management Section
    st.markdown("---")
    st.subheader(t("💾 إدارة الجلسات", "💾 Session Management"))
    
    # Create tabs for session management
    tab1, tab2, tab3 = st.tabs([
        t("📥 تحميل جلسة", "📥 Load Session"),
        t("💾 حفظ الجلسة الحالية", "💾 Save Current Session"), 
        t("🗑️ إدارة الجلسات", "🗑️ Manage Sessions")
    ])
    
    with tab1:
        # Load existing session
        user_sessions = get_user_batch_sessions(user_id)
        
        if user_sessions:
            st.write(t("اختر جلسة لتحميلها:", "Select a session to load:"))
            
            session_options = []
            session_map = {}
            
            for session_id, name, desc, cost, created, updated, item_count in user_sessions:
                display_name = f"🎂 {name} ({item_count} {t('عناصر', 'items')}) - {cost:.2f} {t('تكلفة', 'cost')} - {t('آخر تحديث', 'Updated')}: {updated.strftime('%Y-%m-%d %H:%M')}"
                session_options.append(display_name)
                session_map[display_name] = session_id
            
            selected_session_display = st.selectbox(
                t("الجلسات المحفوظة", "Saved Sessions"),
                [""] + session_options,
                key="load_session_select"
            )
            
            if selected_session_display and st.button(t("📥 تحميل الجلسة", "📥 Load Session")):
                session_id = session_map[selected_session_display]
                session_data, message = load_batch_session(session_id)
                
                if session_data:
                    # Store loaded session in session state
                    st.session_state.loaded_cake_quantities = session_data['items']
                    st.session_state.loaded_session_info = session_data['info']
                    # Clear all existing widget states to force refresh
                    keys_to_clear = [key for key in st.session_state.keys() if key.startswith('qty_')]
                    for key in keys_to_clear:
                        del st.session_state[key]
                    # Set a flag to indicate session was just loaded
                    st.session_state.session_just_loaded = True
                    st.success(t(f"✅ تم تحميل الجلسة: {session_data['info']['name']}", f"✅ Session loaded: {session_data['info']['name']}"))
                    st.rerun()
                else:
                    st.error(f"{t('❌ فشل في تحميل الجلسة', '❌ Failed to load session')}: {message}")
        else:
            st.info(t("لا توجد جلسات محفوظة بعد", "No saved sessions yet"))
    
    with tab2:
        # Save current session
        st.write(t("احفظ الجلسة الحالية للعودة إليها لاحقاً", "Save current session to return to it later"))
        
        # Get current quantities from both session state and widget states
        current_quantities = getattr(st.session_state, 'current_cake_quantities', {})
        
        # Also check widget states for the most current values
        widget_quantities = {}
        for key, value in st.session_state.items():
            if key.startswith('qty_') and isinstance(value, (int, float)) and value > 0:
                cake_id_str = key.replace('qty_', '').split('_')[0]
                try:
                    cake_id = int(cake_id_str)
                    widget_quantities[cake_id] = value
                except ValueError:
                    continue
        
        # Merge both sources, prioritizing widget states (more current)
        all_quantities = {**current_quantities, **widget_quantities}
        
        if all_quantities:
            st.write(t("الكميات الحالية:", "Current quantities:"))
            for cake_id, qty in all_quantities.items():
                # Get cake name
                cake_name = next((name for id, name in cakes if id == cake_id), f"Cake {cake_id}")
                if qty > 0:
                    st.write(f"• {cake_name}: {qty}")
        
        with st.form("save_session_form"):
            session_name = st.text_input(
                t("اسم الجلسة", "Session Name"),
                placeholder=t("مثال: دفعة عيد الميلاد", "e.g. Birthday Batch"),
                max_chars=100
            )
            
            session_description = st.text_area(
                t("وصف الجلسة (اختياري)", "Session Description (optional)"),
                placeholder=t("وصف مختصر للدفعة...", "Brief description of the batch..."),
                max_chars=500
            )
            
            save_submitted = st.form_submit_button(t("💾 حفظ الجلسة", "💾 Save Session"))
        
        if save_submitted and session_name:
            # Get current cake quantities - check both session state and widget states
            current_quantities_all = getattr(st.session_state, 'current_cake_quantities', {})
            
            # Also check widget states directly in case session state hasn't been updated yet
            for key, value in st.session_state.items():
                if key.startswith('qty_') and isinstance(value, (int, float)) and value > 0:
                    # Extract cake_id from key (format: qty_123 or qty_123_loaded_timestamp)
                    cake_id_str = key.replace('qty_', '').split('_')[0]
                    try:
                        cake_id = int(cake_id_str)
                        current_quantities_all[cake_id] = value
                    except ValueError:
                        continue
            
            # Filter out zero quantities for cleaner storage
            current_quantities_filtered = {k: v for k, v in current_quantities_all.items() if v > 0}
            
            if not current_quantities_filtered:
                st.warning(t("⚠️ لا توجد كميات لحفظها. يرجى إضافة كيكات أولاً.", "⚠️ No quantities to save. Please add cakes first."))
            else:
                # Show what will be saved
                st.write(t("سيتم حفظ:", "Will save:"))
                for cake_id, qty in current_quantities_filtered.items():
                    cake_name = next((name for id, name in cakes if id == cake_id), f"Cake {cake_id}")
                    st.write(f"• {cake_name}: {qty}")
                
                # Calculate total cost (we'll update this after calculation)
                total_cost = getattr(st.session_state, 'last_calculated_cost', 0.0)
                
                success, message = save_batch_session(session_name, session_description, current_quantities_filtered, total_cost, user_id)
                
                if success:
                    st.success(f"✅ {message}")
                    # Don't refresh - this was causing data loss
                    # Just clear the form inputs by resetting them
                    st.info(t("💾 الجلسة محفوظة! يمكنك الآن الاستمرار في العمل أو تحميل جلسة أخرى.", 
                             "💾 Session saved! You can now continue working or load another session."))
                else:
                    st.error(f"❌ {message}")
        elif save_submitted:
            st.error(t("❌ يرجى إدخال اسم الجلسة", "❌ Please enter a session name"))
    
    with tab3:
        # Manage existing sessions
        user_sessions = get_user_batch_sessions(user_id)
        
        if user_sessions:
            st.write(t("إدارة الجلسات المحفوظة:", "Manage saved sessions:"))
            
            for session_id, name, desc, cost, created, updated, item_count in user_sessions:
                with st.expander(f"🎂 {name} ({item_count} {t('عناصر', 'items')})"):
                    col1, col2, col3 = st.columns([2, 1, 1])
                    
                    with col1:
                        st.write(f"**{t('الوصف', 'Description')}:** {desc or t('بدون وصف', 'No description')}")
                        st.write(f"**{t('التكلفة', 'Cost')}:** {cost:.2f}")
                        st.write(f"**{t('تاريخ الإنشاء', 'Created')}:** {created.strftime('%Y-%m-%d %H:%M')}")
                        st.write(f"**{t('آخر تحديث', 'Last Updated')}:** {updated.strftime('%Y-%m-%d %H:%M')}")
                    
                    with col2:
                        if st.button(t("📥 تحميل", "📥 Load"), key=f"load_{session_id}"):
                            session_data, message = load_batch_session(session_id)
                            if session_data:
                                st.session_state.loaded_cake_quantities = session_data['items']
                                st.session_state.loaded_session_info = session_data['info']
                                # Clear all existing widget states to force refresh
                                keys_to_clear = [key for key in st.session_state.keys() if key.startswith('qty_')]
                                for key in keys_to_clear:
                                    del st.session_state[key]
                                # Set a flag to indicate session was just loaded
                                st.session_state.session_just_loaded = True
                                st.success(t("✅ تم التحميل", "✅ Loaded"))
                                st.rerun()
                            else:
                                st.error(f"❌ {message}")
                    
                    with col3:
                        if st.button(t("🗑️ حذف", "🗑️ Delete"), key=f"delete_{session_id}", type="secondary"):
                            success, message = delete_batch_session(session_id, user_id)
                            if success:
                                st.success(f"✅ {message}")
                                # Don't auto-refresh to avoid losing current work
                                st.info(t("🔄 قم بتحديث الصفحة لرؤية القائمة المحدثة", "🔄 Refresh the page to see updated list"))
                            else:
                                st.error(f"❌ {message}")
        else:
            st.info(t("لا توجد جلسات محفوظة", "No saved sessions"))
    
    st.markdown("---")

    # Check if we have loaded session data
    loaded_quantities = getattr(st.session_state, 'loaded_cake_quantities', {})
    loaded_info = getattr(st.session_state, 'loaded_session_info', None)
    
    if loaded_info:
        col1, col2 = st.columns([3, 1])
        with col1:
            st.info(t(f"📥 تم تحميل الجلسة: {loaded_info['name']} - التكلفة السابقة: {loaded_info['total_cost']:.2f}", 
                      f"📥 Loaded session: {loaded_info['name']} - Previous cost: {loaded_info['total_cost']:.2f}"))
            # Debug: Show loaded quantities
            if loaded_quantities:
                st.caption(t("الكميات المحملة:", "Loaded quantities:") + " " + 
                          ", ".join([f"{next((name for id, name in cakes if id == cake_id), f'ID{cake_id}')}: {qty}" 
                                   for cake_id, qty in loaded_quantities.items()]))
        with col2:
            if st.button(t("🗑️ مسح الجلسة", "🗑️ Clear Session")):
                # Clear loaded session data
                if 'loaded_cake_quantities' in st.session_state:
                    del st.session_state.loaded_cake_quantities
                if 'loaded_session_info' in st.session_state:
                    del st.session_state.loaded_session_info
                # Clear widget states
                keys_to_clear = [key for key in st.session_state.keys() if key.startswith('qty_')]
                for key in keys_to_clear:
                    del st.session_state[key]
                # Clear Excel upload data
                if 'excel_matched_cakes' in st.session_state:
                    del st.session_state.excel_matched_cakes
                if 'excel_unmatched_names' in st.session_state:
                    del st.session_state.excel_unmatched_names
                if 'manual_additions' in st.session_state:
                    del st.session_state.manual_additions
                st.rerun()

    st.subheader(t('🎂 اختيار الكيكات والكميات', '🎂 Select Cakes and Quantities'))

    # Enhanced Excel Upload Section
    st.markdown("### " + t("📄 تحميل ملف Excel", "📄 Excel Upload"))
    
    # Instructions for Excel format
    with st.expander(t("📋 تعليمات تنسيق ملف Excel", "📋 Excel Format Instructions")):
        st.write(t("""
        **تنسيق الملف المطلوب:**
        - العمود الأول: 'Cake Name' أو 'اسم الكيكة' - أسماء الكيكات
        - العمود الثاني: 'Quantity' أو 'الكمية' - الكميات المطلوبة
        
        **مثال:**
        | Cake Name | Quantity |
        |-----------|----------|
        | Chocolate Cake | 5 |
        | Vanilla Cake | 3 |
        """, """
        **Required File Format:**
        - First Column: 'Cake Name' or 'اسم الكيكة' - Cake names
        - Second Column: 'Quantity' or 'الكمية' - Required quantities
        
        **Example:**
        | Cake Name | Quantity |
        |-----------|----------|
        | Chocolate Cake | 5 |
        | Vanilla Cake | 3 |
        """))
    
    uploaded_file = st.file_uploader(
        t("📄 قم بتحميل ملف Excel مع كميات الكيك", "📄 Upload Excel with Cake Quantities"),
        type=['xlsx', 'xls'],
        help=t("يجب أن يحتوي الملف على عمودين: اسم الكيكة والكمية", "File must contain two columns: Cake Name and Quantity")
    )
    
    # Initialize cake_quantities
    cake_quantities = {}
    
    # Initialize session state for Excel data if not exists
    if 'excel_matched_cakes' not in st.session_state:
        st.session_state.excel_matched_cakes = {}
    if 'excel_unmatched_names' not in st.session_state:
        st.session_state.excel_unmatched_names = []
    if 'manual_additions' not in st.session_state:
        st.session_state.manual_additions = {}

    if uploaded_file is not None:
        try:
            # Read Excel file
            df_uploaded = pd.read_excel(uploaded_file)
            
            # Check for required columns (flexible naming)
            cake_name_col = None
            quantity_col = None
            
            for col in df_uploaded.columns:
                col_lower = str(col).lower()
                if 'cake' in col_lower and 'name' in col_lower or 'اسم' in col_lower and 'كيكة' in col_lower:
                    cake_name_col = col
                elif 'quantity' in col_lower or 'كمية' in col_lower:
                    quantity_col = col
            
            # If exact matches not found, try first two columns
            if cake_name_col is None or quantity_col is None:
                if len(df_uploaded.columns) >= 2:
                    cake_name_col = df_uploaded.columns[0]
                    quantity_col = df_uploaded.columns[1]
                    st.info(t(f"استخدام العمودين الأولين: '{cake_name_col}' و '{quantity_col}'", 
                             f"Using first two columns: '{cake_name_col}' and '{quantity_col}'"))
                else:
                    st.error(t("❌ يجب أن يحتوي ملف Excel على عمودين على الأقل", "❌ Excel file must have at least two columns"))
                    st.stop()
            
            if cake_name_col is None or quantity_col is None:
                st.error(t("❌ لم يتم العثور على الأعمدة المطلوبة في ملف Excel", "❌ Required columns not found in Excel file"))
                st.stop()
            
            # Create mapping of cake names to IDs (case-insensitive)
            cake_name_to_id = {}
            for cake_id, cake_name in cakes:
                cake_name_to_id[cake_name.lower().strip()] = cake_id
            
            # Process uploaded data
            matched_cakes = {}
            partial_matches = []
            unmatched_names = []
            
            # Initialize session state for managing matches if not exists
            if 'ignored_items' not in st.session_state:
                st.session_state.ignored_items = set()
            if 'accepted_partial_matches' not in st.session_state:
                st.session_state.accepted_partial_matches = {}
            
            for index, row in df_uploaded.iterrows():
                try:
                    cake_name = str(row[cake_name_col]).strip()
                    quantity = float(row[quantity_col])
                    
                    if pd.isna(quantity) or quantity <= 0:
                        continue
                    
                    # Skip if this item was ignored
                    if cake_name in st.session_state.ignored_items:
                        continue
                    
                    # Check if this partial match was already accepted
                    if cake_name in st.session_state.accepted_partial_matches:
                        cake_id = st.session_state.accepted_partial_matches[cake_name]
                        matched_cakes[cake_id] = quantity
                        continue
                    
                    # Try to match cake name (case-insensitive)
                    cake_name_lower = cake_name.lower()
                    if cake_name_lower in cake_name_to_id:
                        cake_id = cake_name_to_id[cake_name_lower]
                        matched_cakes[cake_id] = quantity
                    else:
                        # Try partial matching
                        potential_matches = []
                        for db_name_lower, cake_id in cake_name_to_id.items():
                            if cake_name_lower in db_name_lower or db_name_lower in cake_name_lower:
                                db_name_original = next((name for id, name in cakes if id == cake_id), '')
                                potential_matches.append((cake_id, db_name_original))
                        
                        if potential_matches:
                            partial_matches.append({
                                'excel_name': cake_name,
                                'quantity': quantity,
                                'potential_matches': potential_matches
                            })
                        else:
                            unmatched_names.append({'name': cake_name, 'quantity': quantity})
                
                except (ValueError, TypeError) as e:
                    st.warning(t(f"⚠️ تخطي الصف {index + 1}: خطأ في البيانات - {str(e)}", 
                                f"⚠️ Skipping row {index + 1}: Data error - {str(e)}"))
                    continue
            
            # Store in session state
            st.session_state.excel_matched_cakes = matched_cakes
            st.session_state.excel_unmatched_names = unmatched_names
            
            # Display results
            if matched_cakes:
                st.success(t(f"✅ تم العثور على {len(matched_cakes)} كيكة متطابقة تماماً", f"✅ Found {len(matched_cakes)} exact matches"))
                
                # Show matched cakes in a nice format
                st.markdown("#### " + t("🎂 الكيكات المتطابقة تماماً", "🎂 Exact Matches"))
                matched_df = pd.DataFrame([
                    {
                        t('اسم الكيكة', 'Cake Name'): next((name for id, name in cakes if id == cake_id), f'ID: {cake_id}'),
                        t('الكمية', 'Quantity'): quantity
                    }
                    for cake_id, quantity in matched_cakes.items()
                ])
                st.dataframe(matched_df, use_container_width=True)
            
            # Handle partial matches with interactive options
            if partial_matches:
                st.markdown("#### " + t("🔍 تطابقات جزئية - تحتاج لمراجعة", "🔍 Partial Matches - Need Review"))
                st.info(t("يرجى مراجعة التطابقات الجزئية أدناه واختيار الإجراء المناسب", 
                         "Please review the partial matches below and choose the appropriate action"))
                
                for i, partial_match in enumerate(partial_matches):
                    excel_name = partial_match['excel_name']
                    quantity = partial_match['quantity']
                    potential_matches = partial_match['potential_matches']
                    
                    with st.expander(t(f"🔍 '{excel_name}' (الكمية: {quantity})", f"🔍 '{excel_name}' (Quantity: {quantity})")):
                        st.write(t("التطابقات المحتملة:", "Potential matches:"))
                        
                        # Show potential matches with action buttons
                        for j, (cake_id, db_name) in enumerate(potential_matches):
                            col1, col2, col3 = st.columns([3, 1, 1])
                            
                            with col1:
                                st.write(f"• **{db_name}** (ID: {cake_id})")
                            
                            with col2:
                                if st.button(t("✅ قبول", "✅ Accept"), key=f"accept_partial_{i}_{j}"):
                                    # Accept this partial match
                                    st.session_state.accepted_partial_matches[excel_name] = cake_id
                                    if cake_id in matched_cakes:
                                        matched_cakes[cake_id] += quantity
                                    else:
                                        matched_cakes[cake_id] = quantity
                                    st.session_state.excel_matched_cakes = matched_cakes
                                    st.success(t(f"✅ تم قبول التطابق: '{excel_name}' ← '{db_name}'", 
                                               f"✅ Accepted match: '{excel_name}' ← '{db_name}'"))
                                    st.rerun()
                            
                            with col3:
                                if st.button(t("❌ رفض", "❌ Reject"), key=f"reject_partial_{i}_{j}"):
                                    # This just continues to next potential match
                                    st.info(t("تم رفض هذا التطابق", "This match was rejected"))
                        
                        # Option to ignore this item completely
                        st.markdown("---")
                        col1, col2 = st.columns([1, 1])
                        
                        with col1:
                            if st.button(t("🗑️ تجاهل هذا العنصر", "🗑️ Ignore This Item"), key=f"ignore_{i}"):
                                st.session_state.ignored_items.add(excel_name)
                                st.warning(t(f"تم تجاهل '{excel_name}'", f"Ignored '{excel_name}'"))
                                st.rerun()
                        
                        with col2:
                            if st.button(t("➕ إضافة يدوية", "➕ Manual Add"), key=f"manual_add_{i}"):
                                # Add to unmatched for manual processing
                                if {'name': excel_name, 'quantity': quantity} not in unmatched_names:
                                    unmatched_names.append({'name': excel_name, 'quantity': quantity})
                                    st.session_state.excel_unmatched_names = unmatched_names
                                st.info(t("تم نقل العنصر للإضافة اليدوية", "Item moved to manual addition"))
                                st.rerun()
            
            # Show unmatched names with enhanced options
            if unmatched_names:
                st.markdown("#### " + t("❓ الأسماء غير المتطابقة", "❓ Unmatched Names"))
                
                # Show summary table
                unmatched_df = pd.DataFrame(unmatched_names)
                unmatched_df.columns = [t('اسم الكيكة', 'Cake Name'), t('الكمية', 'Quantity')]
                st.dataframe(unmatched_df, use_container_width=True)
                
                # Bulk actions for unmatched items
                st.markdown("##### " + t("🔧 إجراءات جماعية", "🔧 Bulk Actions"))
                col1, col2 = st.columns([1, 1])
                
                with col1:
                    if st.button(t("🗑️ تجاهل جميع العناصر غير المتطابقة", "🗑️ Ignore All Unmatched Items")):
                        for item in unmatched_names:
                            st.session_state.ignored_items.add(item['name'])
                        st.session_state.excel_unmatched_names = []
                        st.warning(t("تم تجاهل جميع العناصر غير المتطابقة", "All unmatched items have been ignored"))
                        st.rerun()
                
                with col2:
                    if st.button(t("🔄 إعادة تعيين جميع التجاهلات", "🔄 Reset All Ignores")):
                        st.session_state.ignored_items = set()
                        st.session_state.accepted_partial_matches = {}
                        st.info(t("تم إعادة تعيين جميع الإعدادات", "All settings have been reset"))
                        st.rerun()
                
                # Manual matching section for unmatched items
                st.markdown("##### " + t("🔧 إضافة يدوية للأسماء غير المتطابقة", "🔧 Manual Addition for Unmatched Names"))
                
                for i, unmatched in enumerate(unmatched_names):
                    with st.expander(t(f"إضافة '{unmatched['name']}' (الكمية: {unmatched['quantity']})", 
                                      f"Add '{unmatched['name']}' (Quantity: {unmatched['quantity']})")):
                        
                        col1, col2, col3 = st.columns([2, 1, 1])
                        
                        with col1:
                            # Select from available cakes
                            cake_options = [f"{name} (ID: {id})" for id, name in cakes]
                            selected_cake = st.selectbox(
                                t("اختر الكيكة المطابقة", "Select matching cake"),
                                [""] + cake_options,
                                key=f"manual_match_{i}"
                            )
                        
                        with col2:
                            # Allow quantity adjustment
                            adjusted_quantity = st.number_input(
                                t("تعديل الكمية", "Adjust quantity"),
                                min_value=0.0,
                                value=float(unmatched['quantity']),
                                step=0.1,
                                key=f"manual_qty_{i}"
                            )
                        
                        with col3:
                            st.write("")  # Spacing
                            if st.button(t("✅ إضافة", "✅ Add"), key=f"add_manual_{i}"):
                                if selected_cake:
                                    # Extract cake ID
                                    cake_id = int(selected_cake.split("(ID: ")[1].replace(")", ""))
                                    
                                    # Add to manual additions
                                    if 'manual_additions' not in st.session_state:
                                        st.session_state.manual_additions = {}
                                    
                                    if cake_id in st.session_state.manual_additions:
                                        st.session_state.manual_additions[cake_id] += adjusted_quantity
                                    else:
                                        st.session_state.manual_additions[cake_id] = adjusted_quantity
                                    
                                    st.success(t(f"✅ تمت إضافة {selected_cake.split(' (ID:')[0]} بكمية {adjusted_quantity}", 
                                               f"✅ Added {selected_cake.split(' (ID:')[0]} with quantity {adjusted_quantity}"))
                                    st.rerun()
                                else:
                                    st.error(t("❌ يرجى اختيار كيكة", "❌ Please select a cake"))
                        
                        # Option to ignore this specific item
                        if st.button(t("🗑️ تجاهل هذا العنصر", "🗑️ Ignore This Item"), key=f"ignore_unmatched_{i}"):
                            st.session_state.ignored_items.add(unmatched['name'])
                            # Remove from unmatched list
                            updated_unmatched = [item for item in unmatched_names if item['name'] != unmatched['name']]
                            st.session_state.excel_unmatched_names = updated_unmatched
                            st.warning(t(f"تم تجاهل '{unmatched['name']}'", f"Ignored '{unmatched['name']}'"))
                            st.rerun()
            
            # Show ignored items summary if any
            if st.session_state.ignored_items:
                with st.expander(t(f"🗑️ العناصر المتجاهلة ({len(st.session_state.ignored_items)})", 
                                  f"🗑️ Ignored Items ({len(st.session_state.ignored_items)})")):
                    for ignored_item in st.session_state.ignored_items:
                        col1, col2 = st.columns([3, 1])
                        with col1:
                            st.write(f"• {ignored_item}")
                        with col2:
                            if st.button(t("↩️ استرداد", "↩️ Restore"), key=f"restore_{ignored_item}"):
                                st.session_state.ignored_items.remove(ignored_item)
                                st.info(t(f"تم استرداد '{ignored_item}'", f"Restored '{ignored_item}'"))
                                st.rerun()
            
            # Combine all matches
            cake_quantities = {**matched_cakes, **st.session_state.manual_additions}
            
        except Exception as e:
            st.error(t(f"❌ خطأ في قراءة ملف Excel: {str(e)}", f"❌ Error reading Excel file: {str(e)}"))
            st.info(t("تأكد من أن الملف يحتوي على عمودين: اسم الكيكة والكمية", "Make sure the file contains two columns: Cake Name and Quantity"))
    
    # Manual selection section (if no Excel file uploaded)
    if not uploaded_file:
        st.markdown("### " + t("🎯 اختيار يدوي", "🎯 Manual Selection"))
        
        selected_cakes = st.multiselect(
            t('اختر الكيكات للإنتاج', 'Select Cakes to Produce'),
            [f"{n} ({t('معرف', 'ID')}:{i})" for i, n in cakes],
            default=[f"{cakes[j][1]} ({t('معرف', 'ID')}:{cakes[j][0]})" for j in range(len(cakes)) if cakes[j][0] in loaded_quantities] if loaded_quantities else None
        )
        
        # Initialize cake_quantities with loaded quantities if available
        if loaded_quantities:
            cake_quantities.update(loaded_quantities)
        
        for cake in selected_cakes:
            cake_id = int(cake.split(f'({t("معرف", "ID")}:')[1].replace(')', ''))
            cake_name = cake.split(f" ({t('معرف', 'ID')}:")[0]
            
            # Use loaded quantity if available, otherwise default to 0
            default_qty = loaded_quantities.get(cake_id, 0.0)
            
            # Create a unique key - use timestamp when session is loaded to force refresh
            widget_key = f"qty_{cake_id}"
            if st.session_state.get('session_just_loaded', False):
                import time
                widget_key += f"_loaded_{int(time.time())}"
            
            # Debug info
            if loaded_quantities and cake_id in loaded_quantities:
                st.caption(f"🔄 {cake_name}: Loading quantity {loaded_quantities[cake_id]}")
            
            qty = st.number_input(
                t(f'كمية {cake_name} (عدد الكيكات)', f'Quantity of {cake_name} (number of cakes)'),
                min_value=0.0,
                step=0.00001,
                format="%.5f",
                value=default_qty,
                key=widget_key
            )
            cake_quantities[cake_id] = qty
    
    # Show current session summary
    if cake_quantities:
        active_quantities = {k: v for k, v in cake_quantities.items() if v > 0}
        if active_quantities:
            st.markdown("### " + t("📋 ملخص الجلسة الحالية", "📋 Current Session Summary"))
            
            summary_data = []
            for cake_id, qty in active_quantities.items():
                cake_name = next((name for id, name in cakes if id == cake_id), f"Unknown (ID: {cake_id})")
                summary_data.append({
                    t('اسم الكيكة', 'Cake Name'): cake_name,
                    t('الكمية', 'Quantity'): qty,
                    t('المصدر', 'Source'): t('Excel', 'Excel') if cake_id in st.session_state.excel_matched_cakes else 
                                          t('إضافة يدوية', 'Manual') if cake_id in st.session_state.manual_additions else 
                                          t('اختيار يدوي', 'Manual Selection')
                })
            
            summary_df = pd.DataFrame(summary_data)
            st.dataframe(summary_df, use_container_width=True)
            
            # Clear session button
            if st.button(t("🗑️ مسح جميع البيانات", "🗑️ Clear All Data")):
                # Clear all session data
                keys_to_clear = ['excel_matched_cakes', 'excel_unmatched_names', 'manual_additions', 'current_cake_quantities']
                for key in keys_to_clear:
                    if key in st.session_state:
                        del st.session_state[key]
                # Clear widget states
                widget_keys_to_clear = [key for key in st.session_state.keys() if key.startswith('qty_')]
                for key in widget_keys_to_clear:
                    del st.session_state[key]
                st.rerun()
    
    # Store current quantities in session state for saving
    st.session_state.current_cake_quantities = cake_quantities

    # Clear the session_just_loaded flag after processing
    if st.session_state.get('session_just_loaded', False):
        st.session_state.session_just_loaded = False

    if cake_quantities and st.button(t('🧮 حساب مكونات الدفعة', '🧮 Calculate Batch Ingredients')):
        # Filter out cakes with zero or negative quantities
        active_cake_quantities = {cake_id: qty for cake_id, qty in cake_quantities.items() if qty > 0}
        
        # Check if at least 2 different cakes are selected
        if len(active_cake_quantities) < 2:
            st.error(t('❌ يجب اختيار كيكتين مختلفتين على الأقل لحساب الدفعة. الدفعات مصممة لإنتاج أنواع متعددة من الكيك.',
                      '❌ You must select at least 2 different cakes to calculate a batch. Batch production is designed for multiple cake types.'))
            st.info(t('💡 لإنتاج نوع واحد من الكيك، يرجى استخدام خيار الإنتاج الفردي.',
                     '💡 To produce a single cake type, please use the individual production option.'))
            return
        
        total_ingredients = {}
        detailed_rows = []
        subrecipe_summary = {}

        for cake_id, num_cakes in active_cake_quantities.items():
            c.execute('SELECT ingredient_or_subrecipe_id, is_subrecipe, quantity FROM cake_ingredients WHERE cake_id = %s', (cake_id,))
            cake_parts = c.fetchall()

            # If there are no ingredients for this cake, log a warning
            if not cake_parts:
                st.warning(t(f"⚠️ الكيكة بالمعرف {cake_id} لا تحتوي على مكونات.", 
                            f"⚠️ Cake with ID {cake_id} has no items."))
                continue

            for iid, is_sub, qty in cake_parts:
                try:  # Add a try-except block to catch and report errors for each ingredient
                    if is_sub:
                        # Convert Decimal types to float to avoid type errors
                        float_qty = float(qty) if isinstance(qty, decimal.Decimal) else qty
                        float_num_cakes = float(num_cakes) if isinstance(num_cakes, decimal.Decimal) else num_cakes
                        
                        resolved = resolve_subrecipe_ingredients_detailed(conn, iid, float_qty * float_num_cakes)
                        detailed_rows.extend(resolved)

                        c.execute('SELECT name FROM sub_recipes WHERE id = %s', (iid,))
                        result = c.fetchone()
                        
                        # Check if the result is None (sub-recipe not found)
                        if result is None:
                            st.error(t(f"❌ لم يتم العثور على الوصفة الفرعية بالمعرف {iid}. يرجى التحقق من صحة البيانات.",
                                      f"❌ Sub-recipe with ID {iid} not found. Please check your data."))
                            continue
                        
                        sr_name = result[0]
                        if sr_name not in subrecipe_summary:
                            subrecipe_summary[sr_name] = {'quantity': 0.0, 'unit_cost': 0.0}
                        subrecipe_summary[sr_name]['quantity'] += float_qty * float_num_cakes

                        if subrecipe_summary[sr_name]['unit_cost'] == 0:
                            unit_cost = sum(r['cost'] for r in resolve_subrecipe_ingredients_detailed(conn, iid, 1.0))
                            subrecipe_summary[sr_name]['unit_cost'] = unit_cost

                        for r in resolved:
                            name = r['ingredient']
                            if name in total_ingredients:
                                total_ingredients[name]['quantity'] += r['quantity']
                                total_ingredients[name]['cost'] += r['cost']
                            else:
                                total_ingredients[name] = {
                                    'quantity': r['quantity'],
                                    'cost': r['cost'],
                                    'unit': r['unit']
                                }
                    else:
                        c.execute('SELECT name, unit, price_per_unit FROM items WHERE id = %s', (iid,))
                        result = c.fetchone()
                        
                        # Check if the result is None (ingredient not found)
                        if result is None:
                            st.error(t(f"❌ لم يتم العثور على المكون بالمعرف {iid}. يرجى التحقق من صحة البيانات.",
                                      f"❌ Ingredient with ID {iid} not found. Please check your data."))
                            continue
                        
                        ing_name, ing_unit, ing_price = result
                        
                        # Convert Decimal types to float to avoid type errors
                        float_qty = float(qty) if isinstance(qty, decimal.Decimal) else qty
                        float_num_cakes = float(num_cakes) if isinstance(num_cakes, decimal.Decimal) else num_cakes
                        float_price = float(ing_price) if isinstance(ing_price, decimal.Decimal) else ing_price
                        
                        scaled_qty = float_qty * float_num_cakes
                        cost = scaled_qty * float_price

                        if ing_name in total_ingredients:
                            total_ingredients[ing_name]['quantity'] += scaled_qty
                            total_ingredients[ing_name]['cost'] += cost
                        else:
                            total_ingredients[ing_name] = {'quantity': scaled_qty, 'unit': ing_unit, 'cost': cost}
                        detailed_rows.append({
                            'source': t('مباشر في الكيكة', 'Direct in Cake'),
                            'ingredient': ing_name,
                            'unit': ing_unit,
                            'quantity': scaled_qty,
                            'cost': cost
                        })
                except Exception as e:
                    # Log the specific error
                    st.error(t(f"❌ خطأ في معالجة المكون/الوصفة الفرعية {iid} للكيكة {cake_id}: {str(e)}",
                              f"❌ Error processing ingredient/sub-recipe {iid} for cake {cake_id}: {str(e)}"))
                    continue

        if total_ingredients:
            st.subheader(t('🧾 إجمالي المكونات المطلوبة للدفعة', '🧾 Total Items Needed for Batch'))
            df = pd.DataFrame([
                {
                    t('المكون', 'Ingredient'): k,
                    t('الكمية', 'Quantity'): round(v['quantity'], 5),
                    t('الوحدة', 'Unit'): v['unit'],
                    t('التكلفة', 'Cost'): round(v['cost'], 2)
                }
                for k, v in total_ingredients.items()
            ])
            st.dataframe(df)
            total_cost = sum(v['cost'] for v in total_ingredients.values())
            # Store total cost in session state for saving
            st.session_state.last_calculated_cost = total_cost
            st.success(t(f'💰 إجمالي تكلفة الدفعة: {round(total_cost, 2)}', f'💰 Total Batch Cost: {round(total_cost, 2)}'))

        if subrecipe_summary:
            st.subheader(t("🧪 ملخص استخدام الوصفات الفرعية", "🧪 Sub-Recipe Usage Summary"))
            df_subs = pd.DataFrame([{
                t('الوصفة الفرعية', 'Sub-Recipe'): k,
                t('الكمية المستخدمة', 'Quantity Used'): round(v['quantity'], 5),
                t('تكلفة الوحدة', 'Unit Cost'): round(v['unit_cost'], 2),
                t('التكلفة الإجمالية', 'Total Cost'): round(v['quantity'] * v['unit_cost'], 2)
            } for k, v in subrecipe_summary.items()])
            st.dataframe(df_subs)
        else:
            df_subs = pd.DataFrame()

        if detailed_rows:
            st.subheader(t("🔍 تفصيل كامل حسب الوصفة الفرعية والمكون", "🔍 Full Breakdown by Sub-Recipe and Ingredient"))
            df_details = pd.DataFrame(detailed_rows)
            df_details = df_details.groupby(['source', 'ingredient', 'unit'], as_index=False).agg({
                'quantity': 'sum',
                'cost': 'sum'
            })
            df_details['quantity'] = df_details['quantity'].round(5)
            df_details['cost'] = df_details['cost'].round(2)
            
            # Rename columns to Arabic/English based on current language
            df_details.columns = [
                t('المصدر', 'source') if col == 'source' else
                t('المكون', 'ingredient') if col == 'ingredient' else
                t('الوحدة', 'unit') if col == 'unit' else
                t('الكمية', 'quantity') if col == 'quantity' else
                t('التكلفة', 'cost') if col == 'cost' else col
                for col in df_details.columns
            ]
            
            st.dataframe(df_details)
        else:
            df_details = pd.DataFrame()

        if not df.empty:
            buffer = io.BytesIO()
            with pd.ExcelWriter(buffer, engine='xlsxwriter') as writer:
                df.to_excel(writer, index=False, sheet_name=t('مكونات الدفعة', 'Batch Ingredients'))
                if not df_subs.empty:
                    df_subs.to_excel(writer, index=False, sheet_name=t('ملخص الوصفات الفرعية', 'Sub-Recipe Summary'))
                if not df_details.empty:
                    df_details.to_excel(writer, index=False, sheet_name=t('تفصيل كامل', 'Full Breakdown'))
                worksheet = writer.sheets[t('مكونات الدفعة', 'Batch Ingredients')]
                worksheet.write(len(df) + 2, 0, t('إجمالي تكلفة الدفعة', 'Total Batch Cost'))
                worksheet.write(len(df) + 2, 1, round(total_cost, 2))

            buffer.seek(0)
            st.download_button(
                label=t('📥 تصدير إلى Excel', '📥 Export to Excel'),
                data=buffer,
                file_name=t('ملخص_انتاج_الدفعة.xlsx', 'batch_production_summary.xlsx'),
                mime='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )

    conn.close()
