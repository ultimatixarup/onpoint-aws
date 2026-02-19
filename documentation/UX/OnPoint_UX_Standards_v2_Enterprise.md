# OnPoint Fleet Command -- Enterprise UX & Frontend Engineering Standards

Version 2.0 (Enterprise Edition)

Authoritative UX reference for all UI enhancements, bug fixes, and new
feature development.

------------------------------------------------------------------------

# 1. Core UX Philosophy

OnPoint is an enterprise-grade telematics platform. UX must reflect:

-   Data integrity by design
-   Predictable behavior across modules
-   Clear system feedback
-   Reduced cognitive load
-   Accessibility compliance
-   Scalable UI architecture
-   Consistency across all entities

All UI changes must reference this document.

------------------------------------------------------------------------

# 2. Enterprise Create / Edit Modal Standards

## Required Fields

-   Required fields marked with `*`
-   Client-side validation enforced
-   Server-side validation must mirror client rules
-   Inline error messages under fields
-   No silent validation failures

## Primary Action Behavior

-   Primary CTA disabled until valid
-   CTA shows loading spinner during API calls
-   Prevent duplicate submissions
-   Cancel disabled or safely abortable during request

## Success Pattern

On successful create/update: 1. Show non-blocking success toast
(top-right) 2. Auto-close modal 3. Refresh parent data table 4.
Optionally highlight newly created record

## Error Pattern

-   API errors → toast with short message
-   Field-level errors mapped under input
-   Network failure → generic error toast
-   Log technical errors silently for diagnostics

------------------------------------------------------------------------

# 3. Enterprise Form UX Patterns

## Real-Time Validation

-   Validate on blur
-   Validate on submit
-   Optional onChange validation for ID formats

## Dirty State Protection

-   Warn before closing modal if form has unsaved changes

## Immutable Fields

-   IDs should not be editable after creation (recommended)

## Auto-Focus

-   Focus first input on modal open
-   Focus first invalid field on submit failure

------------------------------------------------------------------------

# 4. Enterprise Data Integrity Standards

For core entities (Fleet, Driver, Vehicle, Tenant):

Identifiers used for indexing or relationships must be: - Required in
UI - Unique (validated against API) - Immutable after creation
(recommended)

Fleet Requirements: - Fleet ID → Required, unique - Name → Required -
Notes → Optional

------------------------------------------------------------------------

# 5. Accessibility Standards (WCAG-Aligned)

-   Semantic labels for all inputs
-   aria-invalid on invalid fields
-   aria-describedby for error text
-   Keyboard navigation supported
-   ESC closes modal
-   Proper focus trap within modal

------------------------------------------------------------------------

# 6. Loading & Empty States

## Loading

-   Skeleton loaders preferred over spinners for tables
-   Disable actions during loading

## Empty State

-   Clear message
-   Optional call-to-action button Example: "No fleets created yet.
    Create your first fleet to begin."

------------------------------------------------------------------------

# 7. Table UX Standards

-   Sorting enabled on key columns
-   Search/filter available
-   Pagination consistent across modules
-   Row hover state
-   Clickable row navigation (where appropriate)
-   Newly created item highlight (soft background)

## 7.1 Table Overflow & Clipping Prevention (Mandatory)

-   No critical cell content may be clipped (especially Actions column).
-   Wide tables MUST render in a horizontal scroll container.
-   Tables with many columns MUST define a minimum width to prevent
  compressed/truncated actions.
-   Actions column MUST remain fully visible and operable at all supported
  breakpoints.
-   If viewport width is constrained, prefer horizontal scroll over hiding
  controls.

------------------------------------------------------------------------

# 8. Global Toast Provider Pattern

All success and error feedback must use centralized Toast Provider.

Types: - success - error - warning - info

Toasts must: - Auto-dismiss (3--5 seconds) - Not block workflow - Be
visually consistent

------------------------------------------------------------------------

# 9. Reusable Form Validation Hook Pattern

``` javascript
import { useState } from "react";

export function useEnterpriseForm(initialValues, validators) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (field, value) => {
    if (!validators[field]) return null;
    return validators[field](value);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues({ ...values, [name]: value });
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });
    setErrors({ ...errors, [name]: validateField(name, value) });
  };

  const isValid =
    Object.keys(validators).every((key) => values[key]) &&
    Object.values(errors).every((err) => !err);

  return { values, errors, touched, handleChange, handleBlur, isValid };
}
```

------------------------------------------------------------------------

# 10. Mandatory Copilot Prompt Template (Enterprise-Aligned)

All Copilot prompts for UI enhancements must reference this document.

``` markdown
You are a senior frontend engineer working on the OnPoint Fleet Command platform.

All UX decisions MUST comply with:
"OnPoint Enterprise UX & Frontend Engineering Standards v2.0"

## Component Name:
{Component Name}

## Change Type:
- Enhancement / Bug Fix / Validation Fix / UX Improvement

## Requirements:
- Apply validation and feedback patterns per UX Standard v2
- Ensure accessibility compliance
- Ensure toast-based success/error feedback
- Prevent duplicate submissions
- Follow loading & empty state rules
- Maintain consistent table and modal behavior

## Deliverables:
- Updated component code
- Explanation of changes
- Confirmation of compliance with UX Standard v2
```

------------------------------------------------------------------------

# 11. Governance Rule

No UI enhancement, bug fix, or new feature may be implemented without
validating against this UX Standard.

This document serves as authoritative UX reference for OnPoint.

------------------------------------------------------------------------

End of Document
