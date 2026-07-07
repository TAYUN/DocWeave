# 能力规格

## ADDED Requirements

### Requirement: Auth-Gated Workbench Entry

The system SHALL route users through a real login entry before they can access the workbench shell.

#### Scenario: Anonymous user opens the app

- **WHEN** an unauthenticated user opens the web app
- **THEN** the app shows the login entry instead of dropping directly into the workbench shell

#### Scenario: Login success enters workbench

- **WHEN** a user completes login successfully
- **THEN** the app stores the access token, resolves the current user, and navigates into the workbench entry route

### Requirement: Current User And Logout In Shell

The system SHALL expose the current signed-in user inside the workbench shell and provide a logout exit.

#### Scenario: Workbench shell loads

- **WHEN** an authenticated user enters the shell
- **THEN** the shell shows the current user identity and a logout action

#### Scenario: Logout from shell

- **WHEN** a user triggers logout from the shell
- **THEN** the app clears local auth state and returns to the login entry

### Requirement: Real Space Tree Navigation

The system SHALL present a real space/document navigation tree as the workbench entry surface.

#### Scenario: Browse the workbench tree

- **WHEN** an authenticated user enters the workbench
- **THEN** the shell loads real spaces and their documents instead of hard-coded document shortcuts

#### Scenario: Open a document from the space tree

- **WHEN** the user selects a document node from the space tree
- **THEN** the app navigates to the matching document route

### Requirement: Preserve Document Editing Completion Path

The system SHALL preserve the existing document edit-and-save flow after entering through the workbench shell.

#### Scenario: Follow the full M2 chain

- **WHEN** the user logs in, opens a space, opens a document, edits content, and saves
- **THEN** the document page still persists the change successfully through the existing API boundary
