# Decisions

## 1. Build an operational console, not a generic admin report

The plugin is intentionally scoped around merchant friction after checkout. That is where operations teams lose time and where a WooCommerce extension can show practical product judgment.

## 2. Prefer heuristics over false precision

The first version uses clear, explainable heuristics instead of pretending to offer perfect prediction. Each risk signal is understandable by a merchant team and debuggable by another engineer.

## 3. Use dynamic Woo data, but never depend on it for the demo

A portfolio project should still tell a complete story when a reviewer installs it into a blank site. Demo fallback data keeps the interface reviewable while still allowing live Woo stores to use real order intelligence.

## 4. Keep AI optional and overrideable

The “AI-assisted” summary defaults to deterministic language, then exposes a filter hook for external providers. That keeps the plugin shippable, testable, and human-controlled.

## 5. Match the design language without fighting WordPress admin reality

The control-tower design system is adapted into a WordPress-friendly admin shell: same atmosphere, surfaces, color logic, and visual rhythm, but with practical concessions for table density and admin layout constraints.