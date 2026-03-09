export type Locale = 'en' | 'ms' | 'zh';

export interface Translations {
  // Common
  common: {
    loading: string;
    save: string;
    cancel: string;
    confirm: string;
    delete: string;
    edit: string;
    back: string;
    submit: string;
    search: string;
    required: string;
    optional: string;
    allSystemsOnline: string;
    thisMonth: string;
  };

  // Navigation
  nav: {
    dashboard: string;
    visitorParking: string;
    amenities: string;
    communityBoard: string;
    reportIssue: string;
    securityScan: string;
    adminPanel: string;
    myAccount: string;
    profile: string;
    signOut: string;
    language: string;
  };

  // Dashboard
  dashboard: {
    goodMorning: string;
    goodAfternoon: string;
    goodEvening: string;
    resident: string;
    overview: string;
    visitorParking: string;
    activeBookings: string;
    announcements: string;
    accessActive: string;
    facilitiesReserved: string;
    communityUpdates: string;
    bookSlot: string;
    reserveFacilities: string;
    viewBoard: string;
    submitReport: string;
    yourSchedule: string;
    newBooking: string;
    confirmed: string;
    noActiveBookings: string;
    bookFacilityDesc: string;
    bookFacility: string;
    notifications: string;
    newNotif: string;
    community: string;
    reportAnIssue: string;
    reportIssueDesc: string;
  };

  // Login
  login: {
    welcome: string;
    signIn: string;
    signUp: string;
    email: string;
    password: string;
    forgotPassword: string;
    resetPassword: string;
    sendResetLink: string;
    resetSent: string;
    noAccount: string;
    hasAccount: string;
    createAccount: string;
    firstName: string;
    lastName: string;
    phone: string;
    unitNumber: string;
    selectRole: string;
    owner: string;
    tenant: string;
    security: string;
    management: string;
    loginMethod: string;
    passwordLogin: string;
    mobileOtp: string;
    enterPhone: string;
    sendOtp: string;
    enterOtp: string;
    verifyOtp: string;
    registerSuccess: string;
    checkEmail: string;
  };

  // Parking
  parking: {
    title: string;
    subtitle: string;
    available: string;
    occupied: string;
    selected: string;
    completeBooking: string;
    date: string;
    arrivalTime: string;
    duration: string;
    vehiclePlate: string;
    confirmBooking: string;
    processing: string;
    overnightParking: string;
    parkingPass: string;
    backToSelection: string;
    instantConfirm: string;
  };

  // Amenities
  amenities: {
    title: string;
    subtitle: string;
    allFacilities: string;
    availableNow: string;
    popularFacilities: string;
    selectDate: string;
    selectTimeSlot: string;
    bookingConfirmed: string;
    instantQr: string;
    bookNow: string;
    fullyBooked: string;
  };

  // Reporting
  reporting: {
    title: string;
    subtitle: string;
    selectCategory: string;
    facilityMalfunctions: string;
    commonAreaIssues: string;
    serviceProblems: string;
    otherIssues: string;
    description: string;
    addPhotos: string;
    submitReport: string;
    reportSubmitted: string;
    referenceId: string;
    expectedResponse: string;
    submitAnother: string;
    backToDashboard: string;
  };

  // Profile
  profile: {
    title: string;
    details: string;
    vehicles: string;
    securityTab: string;
    history: string;
    tenants: string;
    addVehicle: string;
    plateNumber: string;
    model: string;
    addTenant: string;
    fullName: string;
    emailAddress: string;
  };
}
