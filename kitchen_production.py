import streamlit as st
from datetime import datetime
from db import get_connection
from language_support import t, show_language_selector
from auth import get_current_user
from Warehouse_functions import create_kitchen_batch_log_table
from utils.batch_helpers import resolve_subrecipe_ingredients_detailed

def kitchen_production():
    show_language_selector()
    user = get_current_user()
    conn = get_connection()
    c = conn.cursor()
    create_kitchen_batch_log_table()

    tab1, tab2 = st.tabs([
        t("🧪 تحضير نصف المنتجات", "🧪 Pre-Production"),
        t("🎂 الإنتاج النهائي للكيك", "🎂 Final Cake Production")
    ])

    # ---------------- Tab 1: Pre-Production ----------------
    with tab1:
        st.header(t("🧪 تحضير نصف المنتجات", "🧪 Pre-Production"))

        c.execute("SELECT id, name FROM sub_recipes ORDER BY name")
        subs = c.fetchall()
        sub_selection = {}

        for sid, sname in subs:
            qty = st.number_input(f"{sname}", min_value=0.0, step=1.0, key=f"sub_{sid}")
            if qty > 0:
                sub_selection[sid] = qty

        if sub_selection and st.button(t("✅ تنفيذ التحضير", "✅ Execute Pre-Production")):
            try:
                now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                for sid, qty in sub_selection.items():
                    resolved = resolve_subrecipe_ingredients_detailed(conn, sid, qty)
                    for row in resolved:
                        c.execute("""
                            UPDATE warehouse_stock
                            SET quantity = quantity - %s
                            WHERE warehouse_id = (SELECT id FROM warehouses WHERE name = 'Kitchen Storage')
                              AND ingredient_id = (SELECT id FROM items WHERE name = %s)
                        """, (row['quantity'], row['ingredient']))

                    # Add sub-recipe output to stock
                    c.execute("""
                        INSERT INTO warehouse_stock (warehouse_id, ingredient_id, quantity)
                        VALUES (
                            (SELECT id FROM warehouses WHERE name = 'Kitchen Storage'),
                            %s,
                            %s
                        )
                        ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
                    """, (sid, qty))

                    c.execute("""
                        INSERT INTO pre_production_log (sub_recipe_id, quantity, produced_at, produced_by)
                        VALUES (%s, %s, %s, %s)
                    """, (sid, qty, now, user['username']))

                conn.commit()
                st.success(t("✅ تم تنفيذ التحضير وتحديث المخزون", "✅ Pre-production executed and stock updated"))
            except Exception as e:
                conn.rollback()
                st.error(t("❌ حدث خطأ أثناء التحضير", "❌ Error during pre-production") + f": {str(e)}")

    # ---------------- Tab 2: Final Production ----------------
    with tab2:
        st.header(t("🎂 الإنتاج النهائي للكيك", "🎂 Final Cake Production"))

        c.execute("SELECT id, name FROM cakes ORDER BY name")
        cakes = c.fetchall()
        cake_selection = {}

        for cake_id, cake_name in cakes:
            qty = st.number_input(f"{cake_name}", min_value=0.0, step=1.0, key=f"cake_{cake_id}")
            if qty > 0:
                cake_selection[cake_id] = qty

        if cake_selection and st.button(t("✅ تنفيذ الإنتاج النهائي", "✅ Execute Final Production")):
            try:
                now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                for cake_id, qty in cake_selection.items():
                    c.execute("SELECT ingredient_or_subrecipe_id, is_subrecipe, quantity FROM cake_ingredients WHERE cake_id = %s", (cake_id,))
                    items = c.fetchall()

                    for item_id, is_sub, base_qty in items:
                        total_qty = float(base_qty) * qty
                        if is_sub:
                            # Deduct sub-recipe stock (pre-produced) from Kitchen Storage warehouse
                            c.execute("""
                                UPDATE sub_recipe_stock
                                SET quantity = quantity - %s
                                WHERE warehouse_id = (SELECT id FROM warehouses WHERE name = 'Kitchen Storage')
                                  AND sub_recipe_id = %s
                            """, (total_qty, item_id))
                        else:
                            # Deduct raw ingredient
                            c.execute("""
                                UPDATE warehouse_stock
                                SET quantity = quantity - %s
                                WHERE warehouse_id = (SELECT id FROM warehouses WHERE name = 'Kitchen Storage')
                                  AND ingredient_id = %s
                            """, (total_qty, item_id))

                    # Add final product to Kitchen Storage
                    c.execute("SELECT id FROM items WHERE name = (SELECT name FROM cakes WHERE id = %s)", (cake_id,))
                    row = c.fetchone()
                    if row:
                        ingredient_id = row[0]
                    else:
                        c.execute("INSERT INTO items (name, unit, price_per_unit) SELECT name, 'pcs', 0 FROM cakes WHERE id = %s", (cake_id,))
                        ingredient_id = c.lastrowid
                        c.execute("SELECT id FROM inventory_categories WHERE name = 'Final Product'")
                        cat = c.fetchone()
                        if cat:
                            c.execute("UPDATE items SET category_id = %s WHERE id = %s", (cat[0], ingredient_id))

                    c.execute("""
                        INSERT INTO warehouse_stock (warehouse_id, ingredient_id, quantity)
                        VALUES (
                            (SELECT id FROM warehouses WHERE name = 'Kitchen Storage'),
                            %s,
                            %s
                        )
                        ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
                    """, (ingredient_id, qty))

                    c.execute("""
                        INSERT INTO kitchen_batch_log (item_type, item_id, quantity, produced_at, produced_by)
                        VALUES ('cake', %s, %s, %s, %s)
                    """, (cake_id, qty, now, user['username']))

                conn.commit()
                st.success(t("✅ تم تنفيذ الإنتاج النهائي وتحديث المخزون", "✅ Final production executed and stock updated"))
            except Exception as e:
                conn.rollback()
                st.error(t("❌ حدث خطأ أثناء الإنتاج النهائي", "❌ Error during final production") + f": {str(e)}")

        c.close()
        conn.close()
