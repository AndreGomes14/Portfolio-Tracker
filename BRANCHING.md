# Branching strategy

We use **feature branches** that merge into **develop**.

## Branch naming

- **Feature branches:** `feature/<short-description>`
  - Examples: `feature/db-schema`, `feature/backend-investments-api`, `feature/frontend-dashboard`
- **Integration branch:** `develop` (all features merge here)
- **Main/production:** `master` (optional; can be updated from `develop` for releases)

## Workflow step by step

1. **Start from `develop`**
   ```bash
   git checkout develop
   git pull origin develop
   ```

2. **Create a new feature branch**
   ```bash
   git checkout -b feature/<your-feature-name>
   ```
   Example: `git checkout -b feature/portfolio-summary-cash`

3. **Do your work** (edit, add, commit on the feature branch)
   ```bash
   git add .
   git commit -m "feat: add portfolio total cash summary"
   ```

4. **Merge the feature into `develop`**
   ```bash
   git checkout develop
   git merge feature/<your-feature-name>
   ```
   Optionally delete the feature branch: `git branch -d feature/<your-feature-name>`

5. **Repeat** for the next feature: go back to step 1 and create a new `feature/...` branch from `develop`.

## Summary

- Always create new work in a branch named **`feature/blablabla`**.
- When the feature is done, merge **into `develop`**.
- Keep `develop` as the single integration branch; do not commit directly to `develop` for new features.
