# 🎨 GoalSidebar Styling Enhancement Plan

> This document outlines a two-day step-by-step styling enhancement plan aimed at safely and progressively improving the visual style of the GoalSidebar component under the MUI + CSS Modules architecture, without disrupting any React logic or interactivity.

---

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

## 📆 Day 1: Base Styles and Hover Effects

### 🎯 Goals
- Introduce soft shadows, rounded corners, and subtle hover highlights
- Establish a consistent visual style baseline

### 🔹 Step 1: Define Variables (Recommended in `variables.module.css`)

```css
:root {
  --primary-color: #fbc02d;        /* Energetic yellow: bright but not harsh */
  --hover-bg: #fff9e1;             /* Gentle yellow background on hover */
  --card-shadow: 0px 2px 8px rgba(0, 0, 0, 0.08);
  --card-radius: 12px;
  --text-dark: #333;
}
```

### 🔹 Step 2: GoalSidebar.module.css Styles

```css
.goalCard {
  padding: 12px 16px;
  border-radius: var(--card-radius);
  background-color: #ffffff;
  box-shadow: var(--card-shadow);
  transition: all 0.3s ease;
  margin-bottom: 10px;
  color: var(--text-dark);
  cursor: pointer;
}

.goalCard:hover {
  background-color: var(--hover-bg);
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
```

### 🔹 Step 3: Usage in JSX

```jsx
<div className={styles.goalCard}>
  {/* Goal content */}
</div>
```

---

## 📆 Day 2: Interaction Animations + Selection Highlight

### 🎯 Goals
- Enhance UX feedback (hover animation, selection indication)

### 🔹 Step 4: Highlight Selected Card

```css
.goalCardSelected {
  border: 2px solid var(--primary-color);
  background-color: #fffde7;
}
```

JSX:
```jsx
<div
  className={isSelected ? styles.goalCardSelected : styles.goalCard}
>
  {/* Card content */}
</div>
```

### 🔹 Step 5: Fade-In Animation

```css
.goalCard {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## 💡 Additional Tips: Maintainability & Scalability

| Practice                          | Description |
|----------------------------------|-------------|
| Use `variables.module.css` for consistent color and spacing | Promotes reuse and visual consistency across components |
| Isolate styles per component into `.module.css` files        | e.g., `GoalSidebar.module.css`, `LoginPage.module.css` |
| Enforce clear prompts to AI                                  | Ensures safe modifications only within style boundaries |
| Apply changes step-by-step with versioned commits            | Keeps stable checkpoints throughout development |

---

✅ Once complete, you'll have a visually consistent, clean, and lively sidebar component — with minimal risk and excellent maintainability.

If you’d like help generating a specific `.module.css` implementation, feel free to provide the `GoalSidebar.jsx` content 👍
