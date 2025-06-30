#!/usr/bin/env python3
"""
Database cleanup script to remove orphaned sub-recipe nested records
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db
import models

def cleanup_orphaned_records():
    """Remove orphaned sub_recipe_nested records"""
    db = next(get_db())
    
    try:
        # Find orphaned records where sub_recipe_id doesn't exist
        orphaned_records = db.query(models.SubRecipeNested).outerjoin(
            models.SubRecipe,
            models.SubRecipeNested.sub_recipe_id == models.SubRecipe.id
        ).filter(models.SubRecipe.id == None).all()
        
        print(f"Found {len(orphaned_records)} orphaned sub-recipe nested records")
        
        # Delete orphaned records
        for record in orphaned_records:
            print(f"Deleting orphaned record: ID {record.id}, points to non-existent sub-recipe {record.sub_recipe_id}")
            db.delete(record)
        
        # Find orphaned records where parent_sub_recipe_id doesn't exist
        from sqlalchemy.orm import aliased
        SubRecipeParent = aliased(models.SubRecipe)
        orphaned_parents = db.query(models.SubRecipeNested).outerjoin(
            SubRecipeParent,
            models.SubRecipeNested.parent_sub_recipe_id == SubRecipeParent.id
        ).filter(SubRecipeParent.id == None).all()
        
        print(f"Found {len(orphaned_parents)} orphaned parent sub-recipe nested records")
        
        # Delete orphaned parent records
        for record in orphaned_parents:
            print(f"Deleting orphaned parent record: ID {record.id}, parent sub-recipe {record.parent_sub_recipe_id} doesn't exist")
            db.delete(record)
        
        db.commit()
        print("✅ Cleanup completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during cleanup: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_orphaned_records() 