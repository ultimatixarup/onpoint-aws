# User Manual Maintenance Guide

This folder contains the GitHub-ready user manual for the OnPoint UI.

## Files
- [docs/user-manual/onpoint-user-manual.md](onpoint-user-manual.md): Main user manual.
- images/: Place screenshot files here (referenced in the manual).

## How to Maintain the Manual
1. **Update requirements sources**
   - Re-scan requirement documents in documentation/requirement/ and documentation/user-manual/.
   - Update the “Sources used” list at the top of the manual.

2. **Sync with the UI**
   - Check routes in [src-ui/src/app/AppRouter.tsx](../../src-ui/src/app/AppRouter.tsx) and navigation in [src-ui/src/layout/Sidebar.tsx](../../src-ui/src/layout/Sidebar.tsx).
   - Review the corresponding page components under [src-ui/src/features](../../src-ui/src/features) for filters, tables, and actions.

3. **Mark planned features**
   - If requirements exist but UI is not yet implemented, document them under **Planned / Not Yet Available**.

4. **Screenshots**
   - Store images under docs/user-manual/images/.
   - Keep file names aligned to the placeholders in the manual.

5. **Verify formatting**
   - Keep headings consistent for anchor links.
   - Ensure tables and callouts render correctly in GitHub.

## Screenshot Folder
Create the folder:
- docs/user-manual/images/

Add screenshots with the filenames referenced in the manual.
