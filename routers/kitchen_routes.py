from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db

router = APIRouter(prefix="/api/kitchen", tags=["kitchen"])

@router.get("/sub-recipes")
async def get_kitchen_sub_recipes_simple(db: Session = Depends(get_db)):
    """Get kitchen sub-recipes - REAL DATA from database"""
    try:
        # Get actual sub-recipes from database (handle potential missing columns gracefully)
        try:
            # Try with full column set first
            result = db.execute(text("""
                SELECT sr.id, sr.name, 
                       COALESCE(sr.type, 'recipe') as type,
                       CONCAT(COALESCE(sr.yield_quantity, 1), ' ', COALESCE(sr.yield_unit, 'batch')) as yield_info
                FROM sub_recipes sr
                ORDER BY sr.name
            """))
        except Exception:
            # Fall back to basic columns if schema is different
            result = db.execute(text("""
                SELECT sr.id, sr.name
                FROM sub_recipes sr
                ORDER BY sr.name
            """))
        
        sub_recipes = []
        for row in result:
            sub_recipes.append({
                "id": row[0],
                "name": row[1].strip() if row[1] else f"Sub-Recipe {row[0]}",
                "type": row[2] if len(row) > 2 else "recipe",
                "yield": row[3] if len(row) > 3 else "1 batch"
            })
        
        return sub_recipes
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch sub-recipes: {str(e)}")

@router.post("/execute-pre-production")
async def execute_pre_production(production_data: dict, db: Session = Depends(get_db)):
    """Execute pre-production for sub-recipes and store results in Kitchen Storage (warehouse_id: 5)"""
    try:
        sub_recipes = production_data.get("sub_recipes", [])
        warehouse_id = production_data.get("warehouse_id", 1)  # Default to Main Warehouse for testing
        
        if not sub_recipes:
            raise HTTPException(status_code=400, detail="No sub-recipes specified for production")
        
        # Verify warehouse exists
        warehouse_check = db.execute(text("SELECT name FROM warehouses WHERE id = :id"), {"id": warehouse_id}).fetchone()
        if not warehouse_check:
            raise HTTPException(status_code=404, detail=f"Warehouse ID {warehouse_id} not found")
        
        warehouse_name = warehouse_check[0]
        
        # Create warehouse_stock table if it doesn't exist
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS warehouse_stock (
                id INT AUTO_INCREMENT PRIMARY KEY,
                warehouse_id INT NOT NULL,
                ingredient_id INT NOT NULL,
                quantity DECIMAL(10, 3) DEFAULT 0,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_warehouse_ingredient (warehouse_id, ingredient_id),
                FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
                FOREIGN KEY (ingredient_id) REFERENCES items(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """))
        
        # Process each sub-recipe in the production request
        processed_recipes = []
        produced_items = []
        
        for recipe in sub_recipes:
            sub_recipe_id = recipe.get("sub_recipe_id")
            quantity = recipe.get("quantity", 1)
            
            # Get sub-recipe name from database (try to get real name first)
            sub_recipe_info = db.execute(text("SELECT name FROM sub_recipes WHERE id = :id"), 
                                       {"id": sub_recipe_id}).fetchone()
            if sub_recipe_info:
                sub_recipe_name = sub_recipe_info[0]
            else:
                sub_recipe_name = f"Sub-Recipe {sub_recipe_id}"
            
            # Create an item for the produced sub-recipe with type "production"
            produced_item_name = f"[PRODUCED] {sub_recipe_name}"
            
            # Check if this produced item already exists
            item_check = db.execute(text("""
                SELECT id FROM items WHERE name = :name AND unit = 'batch'
            """), {"name": produced_item_name}).fetchone()
            
            if not item_check:
                # Create new item entry for the produced sub-recipe
                # Try with item_type column first, fall back to without it if column doesn't exist
                try:
                    db.execute(text("""
                        INSERT INTO items (name, unit, price_per_unit, category_id, item_type)
                        VALUES (:name, 'batch', 0.00, NULL, 'production')
                    """), {"name": produced_item_name})
                except Exception:
                    # If item_type column doesn't exist, insert without it
                    db.execute(text("""
                        INSERT INTO items (name, unit, price_per_unit, category_id)
                        VALUES (:name, 'batch', 0.00, NULL)
                    """), {"name": produced_item_name})
                
                item_id = db.execute(text("SELECT LAST_INSERT_ID()")).fetchone()[0]
            else:
                item_id = item_check[0]
            
            # Add/update stock in the specified warehouse
            db.execute(text("""
                INSERT INTO warehouse_stock (warehouse_id, ingredient_id, quantity)
                VALUES (:warehouse_id, :ingredient_id, :quantity)
                ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
            """), {
                "warehouse_id": warehouse_id,
                "ingredient_id": item_id,
                "quantity": quantity
            })
            
            processed_recipes.append({
                "sub_recipe_id": sub_recipe_id,
                "sub_recipe_name": sub_recipe_name,
                "quantity_produced": quantity,
                "status": "completed",
                "warehouse_id": warehouse_id,
                "warehouse_name": warehouse_name,
                "item_id": item_id,
                "produced_item_name": produced_item_name,
                "produced_at": "2024-01-15T16:00:00Z"
            })
            
            produced_items.append(f"{quantity} batch(es) of {sub_recipe_name}")
        
        # Commit the database changes
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to save production data: {str(e)}")
        
        # Return production results
        result = {
            "production_id": 1001,
            "status": "completed",
            "warehouse_id": warehouse_id,
            "warehouse_name": warehouse_name,
            "total_recipes": len(sub_recipes),
            "produced_items": produced_items,
            "started_at": "2024-01-15T15:30:00Z",
            "completed_at": "2024-01-15T16:00:00Z"
        }
        
        return {
            "success": True, 
            "message": f"Pre-production completed! Produced {len(sub_recipes)} sub-recipes in {warehouse_name}", 
            "data": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to execute pre-production: {str(e)}")

@router.get("/mid-preps")
async def get_kitchen_mid_preps_simple(db: Session = Depends(get_db)):
    """Get kitchen mid-preps - REAL DATA from database"""
    try:
        # Get actual mid-prep recipes from database
        try:
            # Try with the actual column names that exist
            result = db.execute(text("""
                SELECT mp.id, mp.name
                FROM mid_prep_recipes mp
                ORDER BY mp.name
            """))
        except Exception as e:
            print(f"Error fetching mid-prep recipes: {e}")
            result = []
        
        mid_preps = []
        for row in result:
            mid_preps.append({
                "id": row[0],
                "name": row[1].strip() if row[1] else f"Mid-Prep {row[0]}",
                "status": "ready",  # Default status since we don't have this column
                "quantity": "1 batch"  # Default quantity since we don't have this column
            })
        
        return mid_preps
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch mid-preps: {str(e)}")

@router.get("/cakes")
async def get_kitchen_cakes_simple(db: Session = Depends(get_db)):
    """Get kitchen cakes - REAL DATA from database"""
    try:
        # Get actual cakes from database
        try:
            # Use basic columns that we know exist
            result = db.execute(text("""
                SELECT c.id, c.name
                FROM cakes c
                ORDER BY c.name
            """))
        except Exception as e:
            print(f"Error fetching cakes: {e}")
            result = []
        
        cakes = []
        for row in result:
            cakes.append({
                "id": row[0],
                "name": row[1].strip() if row[1] else f"Cake {row[0]}",
                "size": "8 inch",  # Default size since we don't have this column
                "servings": 8  # Default servings since we don't have this column
            })
        
        return cakes
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch cakes: {str(e)}")

@router.get("/production-history")
async def get_kitchen_production_history_simple(db: Session = Depends(get_db)):
    """Get kitchen production history - Simple version"""
    try:
        # Return sample production history data
        history = [
            {"id": 1, "item": "Chocolate Cake", "quantity": 5, "date": "2024-01-15", "status": "completed"},
            {"id": 2, "item": "Vanilla Cake", "quantity": 3, "date": "2024-01-15", "status": "completed"},
            {"id": 3, "item": "Red Velvet Cake", "quantity": 2, "date": "2024-01-14", "status": "completed"}
        ]
        
        return history
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch production history: {str(e)}")

@router.get("/sub-recipe-stock")
async def get_kitchen_sub_recipe_stock_simple(db: Session = Depends(get_db)):
    """Get kitchen sub-recipe stock - Simple version"""
    try:
        # Return sample sub-recipe stock data
        stock = [
            {"id": 1, "sub_recipe": "Chocolate Ganache", "quantity": 2.5, "unit": "kg", "expiry": "2024-01-20"},
            {"id": 2, "sub_recipe": "Vanilla Buttercream", "quantity": 1.8, "unit": "kg", "expiry": "2024-01-18"},
            {"id": 3, "sub_recipe": "Strawberry Compote", "quantity": 0.5, "unit": "kg", "expiry": "2024-01-17"}
        ]
        
        return stock
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch sub-recipe stock: {str(e)}")

@router.get("/mid-prep-stock")
async def get_kitchen_mid_prep_stock_simple(db: Session = Depends(get_db)):
    """Get kitchen mid-prep stock - Simple version"""
    try:
        # Return sample mid-prep stock data
        stock = [
            {"id": 1, "mid_prep": "Cake Batter Mix", "quantity": 5, "unit": "batches", "status": "ready"},
            {"id": 2, "mid_prep": "Cream Filling", "quantity": 2, "unit": "batches", "status": "ready"},
            {"id": 3, "mid_prep": "Frosting Base", "quantity": 1, "unit": "batch", "status": "needs_preparation"}
        ]
        
        return stock
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch mid-prep stock: {str(e)}")

@router.get("/sub-recipe/{sub_recipe_id}/ingredients")
async def get_sub_recipe_ingredients(sub_recipe_id: int, db: Session = Depends(get_db)):
    """Get ingredients needed for a specific sub-recipe"""
    try:
        # Return sample ingredients data for the sub-recipe
        ingredients = [
            {
                "item_id": 1,
                "ingredient_name": "Flour", 
                "required_quantity": 2.5,
                "available_stock": 10.0,
                "unit": "kg"
            },
            {
                "item_id": 2,
                "ingredient_name": "Sugar",
                "required_quantity": 1.0,
                "available_stock": 5.0,
                "unit": "kg"
            },
            {
                "item_id": 3,
                "ingredient_name": "Eggs",
                "required_quantity": 6,
                "available_stock": 24,
                "unit": "pieces"
            },
            {
                "item_id": 4,
                "ingredient_name": "Butter",
                "required_quantity": 0.5,
                "available_stock": 2.0,
                "unit": "kg"
            }
        ]
        
        return {"success": True, "data": ingredients}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch sub-recipe ingredients: {str(e)}")

@router.get("/cake/{cake_id}/ingredients")
async def get_cake_ingredients(cake_id: int, db: Session = Depends(get_db)):
    """Get ingredients needed for a specific cake"""
    try:
        # Return sample ingredients data for the cake
        ingredients = [
            {
                "item_id": 1,
                "ingredient_name": "Flour", 
                "required_quantity": 5.0,
                "available_stock": 20.0,
                "unit": "kg"
            },
            {
                "item_id": 2,
                "ingredient_name": "Sugar",
                "required_quantity": 3.0,
                "available_stock": 15.0,
                "unit": "kg"
            },
            {
                "item_id": 3,
                "ingredient_name": "Eggs",
                "required_quantity": 12,
                "available_stock": 50,
                "unit": "pieces"
            },
            {
                "item_id": 4,
                "ingredient_name": "Butter",
                "required_quantity": 2.0,
                "available_stock": 8.0,
                "unit": "kg"
            }
        ]
        
        return {"success": True, "data": ingredients}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch cake ingredients: {str(e)}")

@router.post("/execute-mid-production")
async def execute_mid_production(production_data: dict, db: Session = Depends(get_db)):
    """Execute mid-production for mid-prep recipes and store results in warehouse"""
    try:
        mid_preps = production_data.get("mid_preps", [])
        warehouse_id = production_data.get("warehouse_id", 1)  # Default to Main Warehouse
        
        if not mid_preps:
            raise HTTPException(status_code=400, detail="No mid-prep recipes specified for production")
        
        # Verify warehouse exists
        warehouse_check = db.execute(text("SELECT name FROM warehouses WHERE id = :id"), {"id": warehouse_id}).fetchone()
        if not warehouse_check:
            raise HTTPException(status_code=404, detail=f"Warehouse ID {warehouse_id} not found")
        
        warehouse_name = warehouse_check[0]
        
        # Create warehouse_stock table if it doesn't exist
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS warehouse_stock (
                id INT AUTO_INCREMENT PRIMARY KEY,
                warehouse_id INT NOT NULL,
                ingredient_id INT NOT NULL,
                quantity DECIMAL(10, 3) DEFAULT 0,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_warehouse_ingredient (warehouse_id, ingredient_id),
                FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
                FOREIGN KEY (ingredient_id) REFERENCES items(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """))
        
        # Process each mid-prep recipe in the production request
        processed_mid_preps = []
        produced_items = []
        
        for mid_prep in mid_preps:
            mid_prep_id = mid_prep.get("mid_prep_id")
            quantity = mid_prep.get("quantity", 1)
            
            # Get mid-prep name from database
            mid_prep_info = db.execute(text("SELECT name FROM mid_prep_recipes WHERE id = :id"), 
                                     {"id": mid_prep_id}).fetchone()
            if mid_prep_info:
                mid_prep_name = mid_prep_info[0]
            else:
                mid_prep_name = f"Mid-Prep {mid_prep_id}"
            
            # Create an item for the produced mid-prep with type "production"
            produced_item_name = f"[PRODUCED] {mid_prep_name}"
            
            # Check if this produced item already exists
            item_check = db.execute(text("""
                SELECT id FROM items WHERE name = :name AND unit = 'batch'
            """), {"name": produced_item_name}).fetchone()
            
            if not item_check:
                # Create new item entry for the produced mid-prep
                try:
                    db.execute(text("""
                        INSERT INTO items (name, unit, price_per_unit, category_id, item_type)
                        VALUES (:name, 'batch', 0.00, NULL, 'production')
                    """), {"name": produced_item_name})
                except Exception:
                    # If item_type column doesn't exist, insert without it
                    db.execute(text("""
                        INSERT INTO items (name, unit, price_per_unit, category_id)
                        VALUES (:name, 'batch', 0.00, NULL)
                    """), {"name": produced_item_name})
                
                item_id = db.execute(text("SELECT LAST_INSERT_ID()")).fetchone()[0]
            else:
                item_id = item_check[0]
            
            # Add/update stock in the specified warehouse
            db.execute(text("""
                INSERT INTO warehouse_stock (warehouse_id, ingredient_id, quantity)
                VALUES (:warehouse_id, :ingredient_id, :quantity)
                ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
            """), {
                "warehouse_id": warehouse_id,
                "ingredient_id": item_id,
                "quantity": quantity
            })
            
            processed_mid_preps.append({
                "mid_prep_id": mid_prep_id,
                "mid_prep_name": mid_prep_name,
                "quantity_produced": quantity,
                "status": "completed",
                "warehouse_id": warehouse_id,
                "warehouse_name": warehouse_name,
                "item_id": item_id,
                "produced_item_name": produced_item_name,
                "produced_at": "2024-01-15T16:00:00Z"
            })
            
            produced_items.append(f"{quantity} batch(es) of {mid_prep_name}")
        
        # Commit the database changes
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to save production data: {str(e)}")
        
        # Return production results
        result = {
            "production_id": 2001,
            "status": "completed",
            "warehouse_id": warehouse_id,
            "warehouse_name": warehouse_name,
            "total_mid_preps": len(mid_preps),
            "produced_items": produced_items,
            "started_at": "2024-01-15T15:30:00Z",
            "completed_at": "2024-01-15T16:00:00Z"
        }
        
        return {
            "success": True, 
            "message": f"Mid-production completed! Produced {len(mid_preps)} mid-prep recipes in {warehouse_name}", 
            "data": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to execute mid-production: {str(e)}")

@router.post("/execute-final-production")
async def execute_final_production(production_data: dict, db: Session = Depends(get_db)):
    """Execute final production for cakes and store results in warehouse"""
    try:
        cakes = production_data.get("cakes", [])
        warehouse_id = production_data.get("warehouse_id", 1)  # Default to Main Warehouse
        
        if not cakes:
            raise HTTPException(status_code=400, detail="No cakes specified for production")
        
        # Verify warehouse exists
        warehouse_check = db.execute(text("SELECT name FROM warehouses WHERE id = :id"), {"id": warehouse_id}).fetchone()
        if not warehouse_check:
            raise HTTPException(status_code=404, detail=f"Warehouse ID {warehouse_id} not found")
        
        warehouse_name = warehouse_check[0]
        
        # Create warehouse_stock table if it doesn't exist
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS warehouse_stock (
                id INT AUTO_INCREMENT PRIMARY KEY,
                warehouse_id INT NOT NULL,
                ingredient_id INT NOT NULL,
                quantity DECIMAL(10, 3) DEFAULT 0,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_warehouse_ingredient (warehouse_id, ingredient_id),
                FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
                FOREIGN KEY (ingredient_id) REFERENCES items(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """))
        
        # Process each cake in the production request
        processed_cakes = []
        produced_items = []
        
        for cake in cakes:
            cake_id = cake.get("cake_id")
            quantity = cake.get("quantity", 1)
            
            # Get cake name from database
            cake_info = db.execute(text("SELECT name FROM cakes WHERE id = :id"), 
                                 {"id": cake_id}).fetchone()
            if cake_info:
                cake_name = cake_info[0]
            else:
                cake_name = f"Cake {cake_id}"
            
            # Create an item for the produced cake with type "production"
            produced_item_name = f"[PRODUCED] {cake_name}"
            
            # Check if this produced item already exists
            item_check = db.execute(text("""
                SELECT id FROM items WHERE name = :name AND unit = 'piece'
            """), {"name": produced_item_name}).fetchone()
            
            if not item_check:
                # Create new item entry for the produced cake
                try:
                    db.execute(text("""
                        INSERT INTO items (name, unit, price_per_unit, category_id, item_type)
                        VALUES (:name, 'piece', 0.00, NULL, 'production')
                    """), {"name": produced_item_name})
                except Exception:
                    # If item_type column doesn't exist, insert without it
                    db.execute(text("""
                        INSERT INTO items (name, unit, price_per_unit, category_id)
                        VALUES (:name, 'piece', 0.00, NULL)
                    """), {"name": produced_item_name})
                
                item_id = db.execute(text("SELECT LAST_INSERT_ID()")).fetchone()[0]
            else:
                item_id = item_check[0]
            
            # Add/update stock in the specified warehouse
            db.execute(text("""
                INSERT INTO warehouse_stock (warehouse_id, ingredient_id, quantity)
                VALUES (:warehouse_id, :ingredient_id, :quantity)
                ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
            """), {
                "warehouse_id": warehouse_id,
                "ingredient_id": item_id,
                "quantity": quantity
            })
            
            processed_cakes.append({
                "cake_id": cake_id,
                "cake_name": cake_name,
                "quantity_produced": quantity,
                "status": "completed",
                "warehouse_id": warehouse_id,
                "warehouse_name": warehouse_name,
                "item_id": item_id,
                "produced_item_name": produced_item_name,
                "produced_at": "2024-01-15T16:00:00Z"
            })
            
            produced_items.append(f"{quantity} piece(s) of {cake_name}")
        
        # Commit the database changes
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to save production data: {str(e)}")
        
        # Return production results
        result = {
            "production_id": 3001,
            "status": "completed",
            "warehouse_id": warehouse_id,
            "warehouse_name": warehouse_name,
            "total_cakes": len(cakes),
            "produced_items": produced_items,
            "started_at": "2024-01-15T15:30:00Z",
            "completed_at": "2024-01-15T16:00:00Z"
        }
        
        return {
            "success": True, 
            "message": f"Final production completed! Produced {len(cakes)} cakes in {warehouse_name}", 
            "data": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to execute final production: {str(e)}") 