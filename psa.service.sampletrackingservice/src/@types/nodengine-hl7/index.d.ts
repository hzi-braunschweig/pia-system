// Type definitions for nodengine-hl7 4.1.8
// Project: https://github.com/evanlucas/nodengine-hl7

declare module 'nodengine-hl7' {
  interface Delimiters {
    segment: string;
    field: string;
    component: string;
    subcomponent: string;
    repetition: string;
    escape: string;
  }

  type ParsedSegment = NTE | OBR | OBX | ORC | PID;

  export declare class Segment {
    public parsed?: ParsedSegment;

    public constructor(data: string, delimiters?: Delimiters);

    public parse(data: string): Segment | false;

    public isHeader(): boolean;
  }

  export declare class Message {
    public segments: Segment[];

    public constructor();

    public delimiters(): Delimiters;

    public addSegment(segment: Segment): void;
  }

  interface NTE {
    SegmentType: 'NTE';
    SetID: string;
    SourceOfComment: string;
    Comment: string;
    CommentType: string;
  }

  interface OBR {
    SegmentType: 'OBR';
    SetID: string;
    PlacerOrderNumber: string;
    FillerOrderNumber: string;
    UniversalServiceID: string;
    Priority: string;
    RequestedDateTime: string;
    ObservationDateTime: string;
    ObservationEndDateTime: string;
    CollectionVolume: string;
    CollectorIdentifier: string;
    SpecimenActionCode: string;
    DangerCode: string;
    'RelevantClinicalInfo.': string;
    SpecimenReceivedDateTime: string;
    SpecimenSource: string;
    OrderingProvider: string;
    OrderCallbackPhoneNumber: string;
    PlacerField1: string;
    PlacerField2: string;
    FillerField1: string;
    FillerField2: string;
    ResultsRptStatusChngDateTime: string;
    ChargeToPractice: string;
    DiagnosticServSectID: string;
    ResultStatus: string;
    ParentResult: string;
    QuantityTiming: string;
    ResultCopiesTo: string;
    Parent: string;
    TransportationMode: string;
    ReasonForStudy: string;
    PrincipalResultInterpreter: string;
    AssistantResultInterpreter: string;
    Technician: string;
    Transcriptionist: string;
    ScheduledDateTime: string;
    NumberofSampleContainers: string;
    TransportLogisticsOfCollectedSample: string;
    CollectorsComment: string;
    TransportArrangementResponsibility: string;
    TransportArranged: string;
    EscortRequired: string;
    PlannedPatientTransportComment: string;
    ProcedureCode: string;
    ProcedureCodeModifier: string;
  }

  interface OBX {
    SegmentType: 'OBX';
    SetID: string;
    ValueType: string;
    ObservationIdentifier: string;
    ObservationSubID: string;
    ObservationValue: string;
    Units: string;
    ReferencesRange: string;
    AbnormalFlags: string;
    Probability: string;
    NatureofAbnormalTest: string;
    ObservationResultStatus: string;
    EffectiveDateofReferenceRange: string;
    UserDefinedAccessChecks: string;
    DateTimeoftheObservation: string;
    ProducersID: string;
    ResponsibleObserver: string;
    ObservationMethod: string;
    EquipmentInstanceIdentifier: string;
    DateTimeoftheAnalysis: string;
    ObservationSite: string;
    ObservationInstanceIdentifier: string;
    MoodCode: string;
    PerformingOrganizationName: string;
    PerformingOrganizationAddress: string;
    PerformingOrganizationMedicalDirector: string;
  }

  interface ORC {
    SegmentType: 'ORC';
    OrderControl: string;
    PlacerOrderNumber: string;
    FillerOrderNumber: string;
    PlacerGroupNumber: string;
    OrderStatus: string;
    ResponseFlag: string;
    QuantityTiming: string;
    Parent: string;
    DateTimeofTransaction: string;
    EnteredBy: string;
    VerifiedBy: string;
    OrderingProvider: string;
    EnterersLocation: string;
    CallBackPhoneNumber: string;
    OrderEffectiveDateTime: string;
    OrderControlCodeReason: string;
    EnteringOrganization: string;
    EnteringDevice: string;
    ActionBy: string;
    AdvancedBeneficiaryNoticeCode: string;
    OrderingFacilityName: string;
    OrderingFacilityAddress: string;
    OrderingFacilityPhoneNumber: string;
    OrderingProviderAddress: string;
    OrderStatusModifier: string;
    AdvancedBeneficiaryNoticeOverrideReason: string;
    FillersExpectedAvailabilityDateTime: string;
    ConfidentialityCode: string;
    OrderType: string;
    EntererAuthorizationMode: string;
    ParentUniversalServiceIdentifier: string;
  }

  interface PID {
    SegmentType: 'PID';
    SetID: string;
    PatientID: string;
    PatientIdentifierList: string;
    AlternatePatientID: string;
    PatientName: string;
    MothersMaidenName: string;
    DateTimeofBirth: string;
    AdministrativeSex: string;
    PatientAlias: string;
    Race: string;
    PatientAddress: string;
    CountyCode: string;
    PhoneNumberHome: string;
    PhoneNumberBusiness: string;
    PrimaryLanguage: string;
    MaritalStatus: string;
    Religion: string;
    PatientAccountNumber: string;
    SSNNumberPatient: string;
    DriversLicenseNumberPatient: string;
    MothersIdentifier: string;
    EthnicGroup: string;
    BirthPlace: string;
    MultipleBirthIndicator: string;
    BirthOrder: string;
    Citizenship: string;
    VeteransMilitaryStatus: string;
    Nationality: string;
    PatientDeathDateandTime: string;
    PatientDeathIndicator: string;
    IdentityUnknownIndicator: string;
    IdentityReliabilityCode: string;
    LastUpdateDateTime: string;
    LastUpdateFacility: string;
    SpeciesCode: string;
    BreedCode: string;
    Strain: string;
    ProductionClassCode: string;
    TribalCitizenship: string;
  }
}
