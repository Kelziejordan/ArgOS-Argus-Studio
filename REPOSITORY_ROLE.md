# Repository Role Declaration — ArgOS-Argus-Studio

Declaration version: 1.0
Effective status: FROZEN AUTHORITY BOUNDARY
Repository: Kelziejordan/ArgOS-Argus-Studio

## Architectural classification
- Tier: 2 — Product/workspace surface
- Lifecycle: Active / product development
- Source of truth: No for Core/runtime contracts; source of truth only for its own Studio implementation
- Historical/reference status: May contain derived Argus/ArgOS concepts

## Authority
- Identity: CONSUMER
- State: CONSUMER
- Governance: CONSUMER
- Provenance: CONSUMER
- Execution: OWNER only for Studio-local interaction behavior

## Dependencies
Studio must consume current runtime contracts. It must not make UI state, browser state, or Studio-local persistence authoritative over ArgCore or Arg.

## Owned contracts
Studio owns operator-facing interface behavior, visualization, workflow presentation, and Studio-local UX contracts.

It does not own identity, foundational state, governance, provenance, or governed execution contracts.

## Permitted modifications
May evolve Studio UX and integration behavior. Any change that crosses into runtime governance must be implemented and verified at the current Arg/ArgCore boundary.

## Contents
- Original implementation: Yes
- Derived implementation: Yes
- Documentation: Some
- Packaging/deployment: Yes
- Historical/provenance: Some
- Experimental: Possible, explicitly marked

## Authority boundary
Studio is an interface and workspace consumer, not a constitutional or runtime authority.
