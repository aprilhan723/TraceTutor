# Changelog

Notable user-visible, security, governance, and release changes are recorded here.

This project follows semantic versioning while the public API and product remain pre-1.0.

## [Unreleased]

### Changed

- Added a prominent learner start/resume action before secondary dashboard metrics.
- Reorganized tutor adjudication into three guided steps with optional controls separated from the primary path.
- Replaced learner- and tutor-facing `D2`/`D7` abbreviations with plain-language 2-day and 7-day review labels.
- Recorded a privacy-safe maintainer tutor usability review and added a subject-adapter design step without claiming multi-subject support.

## [0.2.0] - 2026-08-15

### Changed

- Released the repository under the MIT License.
- Opened code, documentation, accessibility, testing, and privacy-safe product contributions.
- Added maintainer governance, a public roadmap, support and reuse guides, a Code of Conduct, and structured contribution templates.
- Added explicit accountability rules for AI-assisted contributions.
- Reconciled product and architecture documents with the open-source boundary.

### Security

- Verified the current 251-file tree and all 23 repository commits for common credential patterns before the visibility change.
- Confirmed that matched emails and identifiers are synthetic test fixtures.
- Kept the existing no-secret Demo Mode, static RLS verification, repository secret scan, and least-privilege CI permissions.

### Product

- No application behavior, hosted data, environment variable, payment setting, or live-AI setting changed in this release.

## [0.1.0] - 2026-08-13

- Released the public account beta, founding-tutor pilot workflow, and tutor-first entry diagnostic.
- Preserved the complete browser-local Demo Mode.
- Verified unit, browser, accessibility, RLS, secret-scan, dependency, and production-build gates.
