# Binary Tree Growth Animation

A standalone HTML/CSS/JavaScript experience that renders an animated, procedurally generated binary tree. The tree grows level by level from a single root, branching organically with randomized angles and length decay so the entire canopy blooms on screen. When the animation completes, the message **"Happy Valentine's Day Lara"** appears above the tree.

## 🌳 Features

- Recursive binary-tree generation with deterministic random jitter for natural variety
- Progressive growth animation that reveals each branch from trunk to tips
- Canvas automatically rescales to fit and center the entire tree on any viewport
- Responsive layout with glassy UI chrome and descriptive copy
- Celebration message appears exactly at the top of the finished tree
- Zero dependencies, zero build tooling — just open the HTML file

## 📁 Project Structure

```
.
├── index.html                # Markup and layout shell
├── styles.css                # Visual design, layout, responsive styling
├── main.js                   # Tree generation, animation loop, scaling logic
├── README.md                 # Project overview and usage instructions
└── .github/workflows/deploy.yml  # GitHub Pages automation
```

## 🚀 Running the Project

No tooling is required. Open `index.html` in any modern browser (Chrome, Edge, Firefox, Safari, mobile) and the animation will start automatically.

Optional local server for live reload (requires Node.js):

```powershell
cd .
npx serve@latest .
```

Then visit the provided local URL.

## 🌐 Publishing on GitHub Pages

This repository already includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that pushes the site to GitHub Pages automatically. To publish:

1. **Push to GitHub**
	```powershell
	git init
	git add .
	git commit -m "Initial tree animation"
	git branch -M main
	git remote add origin https://github.com/<your-username>/<repo>.git
	git push -u origin main
	```
2. **Enable Pages in the repo**
	- Go to **Settings → Pages**.
	- Under “Build and deployment,” choose **GitHub Actions** (it should already reference the included workflow).
3. **Wait for the workflow**
	- Check the **Actions** tab for a run titled “Deploy static site to GitHub Pages.”
	- Once it finishes, the deployment URL appears in the run summary and on the Pages settings screen.
4. **Share the link**
	- Navigate to the published URL (e.g., `https://<user>.github.io/<repo>/`).
	- Verify the animation and greeting render correctly on desktop and mobile.

Any subsequent push to `main` retriggers the workflow and refreshes the live site automatically.

## ⚙️ Configuration

Tweaking the `CONFIG` object inside `main.js` lets you change depth, branch angles, animation speed, and more. Every change is immediate after refreshing the browser.

## ♿ Accessibility Notes

- Canvas includes an accessible description via `aria-label`
- Greeting text toggles `aria-hidden` when it becomes visible
- High contrast palette keeps branches readable on all displays

Enjoy the binary bloom! 🌸
