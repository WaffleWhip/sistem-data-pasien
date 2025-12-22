# Project Architecture & Logic Flow

This document describes the core logic and architecture of the Patient Data System using Mermaid diagrams.

## System Workflow

```mermaid
flowchart TD
    %% Styling
    classDef actor fill:#f9fafb,stroke:#6b7280,stroke-width:2px;
    classDef frontend fill:#e0e7ff,stroke:#7c3aed,stroke-width:2px;
    classDef backend fill:#dbeafe,stroke:#2563eb,stroke-width:2px;
    classDef db fill:#fff7ed,stroke:#d97706,stroke-width:2px;
    classDef logic fill:#f0fdf4,stroke:#16a34a,stroke-dasharray: 5 5;

    %% Actors
    User((User/Patient)):::actor
    Admin((Doctor/Admin)):::actor

    %% System Components
    subgraph Client [Frontend Service]
        UI_Reg[Registration Page]:::frontend
        UI_Dash[Dashboard Logic]:::frontend
    end

    subgraph Backend [Microservices Layer]
        GW[Gateway]:::backend
        AuthSvc[Auth Service]:::backend
        PatSvc[Patient Service]:::backend
    end

    subgraph Database [Data Persistence]
        MongoDB[(MongoDB Cluster)]:::db
    end

    %% --- FLOW 1: REGISTRATION & AUTO-BINDING ---
    User -->|1. Register| UI_Reg
    UI_Reg -->|POST Data| GW
    GW -->|Route| PatSvc

    subgraph Binding_Logic [Auto-Binding Logic]
        direction TB
        Step1[Standardize Phone <br/> convert +62/62 to '08']:::logic
        Step2{Check DB: <br/>Phone Exists AND <br/>userId is NULL?}:::logic
        Step3_Yes[LINKING: <br/>Update existing record <br/>set userId = newId]:::logic
        Step3_No[CREATING: <br/>Create fresh Patient document]:::logic

        PatSvc --> Step1
        Step1 --> Step2
        Step2 -->|Yes| Step3_Yes
        Step2 -->|No| Step3_No
    end
    Binding_Logic -->|Save| MongoDB

    %% --- FLOW 2: DASHBOARD UI STATE ---
    User -->|2. Login & View| UI_Dash
    UI_Dash -->|GET /me| PatSvc
    PatSvc -->|Return Patient Data| UI_Dash

    subgraph UI_State_Logic [UI Conditional Rendering]
        direction TB
        CheckDiag{Diagnosis == <br/>'No diagnosis yet'?}:::logic
        State_New[RENDER 'Welcome Card' <br/>(Hide Medical Status)]:::logic
        State_Old[RENDER 'Health Record' <br/>(Show Status + History)]:::logic

        UI_Dash --> CheckDiag
        CheckDiag -->|Yes| State_New
        CheckDiag -->|No| State_Old
    end

    %% --- FLOW 3: MEDICAL HISTORY TRACKING ---
    Admin -->|3. Update Clinical Data| PatSvc
    
    subgraph History_Logic [History Tracking Middleware]
        direction TB
        FetchOld[Fetch Old Document]:::logic
        PushHistory[Push Old Data to <br/>'medicalHistory' Array]:::logic
        UpdateNew[Overwrite with New Data]:::logic

        PatSvc --> FetchOld
        FetchOld --> PushHistory
        PushHistory --> UpdateNew
    end
    History_Logic -->|Save| MongoDB
```

## Key Mechanisms

1. **Phone Standardization**: All phone numbers are forced to start with `08`. The backend converts `+62` or `62` to `0` and adds a leading `0` if missing.
2. **Auto-Binding Logic**: When a new user registers, the `patient-service` checks if a patient record with the same phone number already exists (created by an admin). If found and `userId` is null, it links the new user ID to that existing record.
3. **Medical History Tracking**: Every time an admin updates clinical fields (`diagnosis`, `status`, `doctorNotes`), the previous state is automatically pushed into the `medicalHistory` array.
4. **Conditional UI**: The frontend checks the diagnosis string. If it's the default "No diagnosis yet", it displays a "Welcome" card instead of the medical status block to keep the UI clean for new users.
