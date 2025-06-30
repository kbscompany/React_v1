# Enhanced Recipe Editing API

The editing endpoints now support full recipe composition editing, not just name changes.

## Enhanced PUT Endpoints

### 1. Update Cake (`PUT /cakes-manage/{cake_id}`)

**Request Format:**
```json
{
  "name": "Updated Cake Name",
  "percent_yield": 95.0,
  "ingredients": [
    {"id": 1, "quantity": 0.5},
    {"id": 77, "quantity": 0.02}
  ],
  "sub_recipes": [
    {"id": 8, "quantity": 0.4},
    {"id": 11, "quantity": 0.18}
  ],
  "mid_preps": [
    {"id": 3, "quantity": 1.0}
  ]
}
```

### 2. Update Sub-Recipe (`PUT /sub-recipes-manage/{sub_recipe_id}`)

**Request Format:**
```json
{
  "name": "Updated Sub-Recipe Name",
  "ingredients": [
    {"id": 19, "quantity": 1.0},
    {"id": 30, "quantity": 0.9}
  ],
  "sub_recipes": [
    {"id": 5, "quantity": 0.2}
  ]
}
```

### 3. Update Mid-Prep Recipe (`PUT /mid-prep-recipes-manage/{mid_prep_id}`)

**Request Format:**
```json
{
  "name": "Updated Mid-Prep Name",
  "ingredients": [
    {"id": 25, "quantity": 2.0}
  ],
  "sub_recipes": [
    {"id": 8, "quantity": 0.5}
  ]
}
```

## Helper Endpoints for Editing

### Get Available Ingredients
```
GET /ingredients-for-editing
```
Returns all available ingredients with their details for dropdown selection.

### Get Available Sub-Recipes
```
GET /sub-recipes-for-editing
```
Returns all available sub-recipes for dropdown selection.

### Get Available Mid-Prep Recipes
```
GET /mid-preps-for-editing
```
Returns all available mid-prep recipes for dropdown selection.

## Frontend Usage Example

```javascript
// 1. Load available ingredients and recipes for dropdowns
const ingredients = await fetch('/ingredients-for-editing').then(r => r.json());
const subRecipes = await fetch('/sub-recipes-for-editing').then(r => r.json());
const midPreps = await fetch('/mid-preps-for-editing').then(r => r.json());

// 2. Get current cake data
const cake = await fetch(`/cakes-manage`).then(r => r.json());
const currentCake = cake.find(c => c.id === cakeId);

// 3. Update cake with new composition
const updateData = {
  name: "New Cake Name",
  percent_yield: 90.0,
  ingredients: [
    {id: 1, quantity: 0.5},
    {id: 77, quantity: 0.02}
  ],
  sub_recipes: [
    {id: 8, quantity: 0.4}
  ],
  mid_preps: [
    {id: 3, quantity: 1.0}
  ]
};

const result = await fetch(`/cakes-manage/${cakeId}`, {
  method: 'PUT',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify(updateData)
});
```

## Key Features

- ✅ **Full Recipe Editing**: Change ingredients, sub-recipes, mid-preps, and quantities
- ✅ **Automatic Cost Calculation**: Costs recalculated properly using cost-per-kg logic
- ✅ **Clean Updates**: Old relationships are deleted and replaced with new ones
- ✅ **Validation**: Quantities must be > 0, names must be provided
- ✅ **Helper Endpoints**: Easy access to available ingredients and recipes for dropdowns 