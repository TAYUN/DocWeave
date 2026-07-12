# 能力规格：collaboration-save-boundary-baseline

## ADDED Requirements

### Requirement: Automatic Persistence And Explicit Stable Snapshot Actions Must Stay Separate

The system SHALL keep collaboration auto-persistence separate from explicit stable snapshot and indexing actions.

#### Scenario: Auto-persistence updates recoverable body truth only

- **GIVEN** collaborative editing is happening in a live room
- **WHEN** automatic persistence runs in the background
- **THEN** the persisted result is only the recoverable current body truth
- **AND** the system does not claim that a stable snapshot has been created

#### Scenario: Explicit snapshot action still owns stable version creation

- **GIVEN** a user or workflow explicitly triggers stable snapshot creation
- **WHEN** the snapshot API runs
- **THEN** stable snapshot creation continues to use the existing snapshot contract from the M4 baseline
- **AND** automatic collaboration persistence does not redefine snapshot version rules

#### Scenario: Existing save-document behavior does not silently gain snapshot side effects

- **GIVEN** the document page already has an explicit save-document path
- **WHEN** M4 collaboration persistence is added
- **THEN** that save path may continue updating the document patch
- **AND** it does not silently become an automatic stable snapshot creation path unless a separate explicit action is invoked
