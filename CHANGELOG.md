# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-04-06

### Added

- **Sections:** Archive sections (hidden from the main list, restorable from an “Archived” block) or delete permanently; confirmation dialogs for archive and permanent delete; inline Archive and Delete actions on each section.
- **Metadata:** App icons (favicon and Apple touch icon) use `public/logo.png` to match the header brand mark.

### Changed

- **Sidebar:** Consistent top padding (`pt-5`) on collapsible content for Brief, Sections, and Source so the first line of each panel aligns with the same spacing below section headers.

### Data model

- `Section` includes optional `archived` for soft-hide without deleting.
