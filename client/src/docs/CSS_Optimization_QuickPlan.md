# 🚀 Quick CSS Styling Plan (1–2 Day Implementation)

## ⏱️ Timeline
- **Day 1**: Base theme setup + High-impact components (Approx. 6–8 hours)
- **Day 2**: Refinement & polish (Approx. 2–4 hours)


We have 4 pages:

/Home.jsx

/guestLogin.jsx
/Login.jsx
/Register.jsx

## ✅ Prerequisites (Styling Constraints)

Make sure to use the following prompt when working with AI to enforce strict safety boundaries:

```
Do not modify global class names (such as button, .container, .card, etc.)
Avoid overriding MUI’s internal class names (like .MuiButton-root); instead, use the sx prop or styled() API
I use CSS Modules, so please provide styles in a .module.css file and apply them via styles.xxx
Do not alter JSX structure or component props (like onClick handlers or state logic); focus only on styling
Ensure that styles do not interfere with existing component functionality or React state management
```

---

## 📊 One-Day Implementation Steps

### Phase 1: Theme Foundation (2 hours)
1. Create a base MUI theme file
2. Apply a Journey-inspired color palette
3. Integrate the theme into the main app
4. Quick test of the basic look and feel

### Phase 2: High-Impact Components (4–6 hours)
Prioritized by importance:

1. **Core Page Background** (1 hour)  
   - Add gradient background  
   - Adjust white card contrast  

2. **Goal Sidebar** (1.5 hours)  
   - Style goal cards  
   - Improve priority tags  
   - Add simple hover effects  

3. **Weekly Progress Cards** (1.5 hours)  
   - Highlight today  
   - Add card shadows and borders  
   - Standardize spacing  

4. **Buttons & Interactive Elements** (1 hour)  
   - Style primary action buttons  
   - Add icons and micro-animations  
   - Unify form element styles  

---

## 🎨 Streamlined Color Palette

| Usage        | New Color (Journey Style)     |
|--------------|-------------------------------|
| Primary      | Deep Teal `#0D5E6D`            |
| Secondary    | Coral `#FF7F66`                |
| Background   | Dark Blue Gradient `#081F2C → #0A2536` |
| Cards        | White + Shadow                 |
| Success      | Mint Green `#4CD7D0`           |

---

## 💡 Implementation Strategy

### Leverage MUI Built-in Tools:
```jsx
