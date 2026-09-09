// Domain constants for PrimeDesk CRM

export const CITIES = ["Hyderabad", "Bangalore", "Chennai", "Delhi"] as const;

export const MICRO_MARKETS: Record<string, string[]> = {
  Hyderabad: [
    "HITEC City",
    "Gachibowli",
    "Financial District",
    "Madhapur",
    "Kondapur",
    "Banjara Hills",
    "Begumpet",
    "Uppal",
  ],
  Bangalore: [
    "Koramangala",
    "Indiranagar",
    "Whitefield",
    "Electronic City",
    "MG Road",
    "HSR Layout",
    "Outer Ring Road",
  ],
  Chennai: ["OMR", "Guindy", "T. Nagar", "Anna Nagar", "Ambattur", "Nungambakkam"],
  Delhi: ["Connaught Place", "Nehru Place", "Gurgaon Cyber City", "Noida Sector 62", "Saket", "Aerocity"],
};

export const INDUSTRIES = [
  "IT / Software",
  "Fintech",
  "Startup",
  "GCC",
  "Consulting",
  "Healthcare",
  "E-commerce",
  "Manufacturing",
  "Other",
] as const;

export const SEAT_RANGES = ["20-50", "50-100", "100-200", "200+"] as const;

export const MOVE_IN_TIMELINES = [
  { value: "immediate", label: "Immediate" },
  { value: "1_month", label: "1 month" },
  { value: "3_months", label: "3 months" },
  { value: "6_months", label: "6 months" },
  { value: "exploring", label: "Just exploring" },
] as const;

export const WORKSPACE_TYPES = [
  { value: "MANAGED_OFFICE", label: "Managed Office" },
  { value: "COWORKING", label: "Co-working" },
  { value: "PLUG_AND_PLAY", label: "Plug & Play" },
  { value: "CUSTOMIZED", label: "Customized" },
  { value: "GCC_ENTERPRISE", label: "GCC / Enterprise" },
  { value: "NOT_SURE", label: "Not sure" },
] as const;

export const ENQUIRY_SOURCES = [
  { value: "WEBSITE_FORM", label: "Website" },
  { value: "WHATSAPP_INBOUND", label: "WhatsApp" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "FACEBOOK_ADS", label: "Facebook Ads" },
  { value: "INSTAGRAM_ADS", label: "Instagram Ads" },
  { value: "GOOGLE_ADS", label: "Google Ads" },
  { value: "REFERRAL", label: "Referral" },
  { value: "COLD_CALL", label: "Cold Call" },
  { value: "DIRECT_CALL", label: "Direct Call" },
  { value: "WALK_IN", label: "Walk-in" },
  { value: "OTHER", label: "Other" },
] as const;

export const ENQUIRY_STATUSES = [
  "NEW",
  "ADVISOR_ASSIGNED",
  "REQUIREMENT_CALL_DONE",
  "SHORTLIST_SENT",
  "VISIT_SCHEDULED",
  "VISIT_DONE",
  "NEGOTIATION",
  "CLOSED_WON",
  "CLOSED_LOST",
  "PAUSED",
] as const;

export const ENQUIRY_STATUS_META: Record<
  string,
  { label: string; color: string }
> = {
  NEW: { label: "New", color: "bg-blue-100 text-blue-700" },
  ADVISOR_ASSIGNED: { label: "Assigned", color: "bg-indigo-100 text-indigo-700" },
  REQUIREMENT_CALL_DONE: { label: "Req. Call Done", color: "bg-violet-100 text-violet-700" },
  SHORTLIST_SENT: { label: "Shortlist Sent", color: "bg-amber-100 text-amber-700" },
  VISIT_SCHEDULED: { label: "Visit Scheduled", color: "bg-cyan-100 text-cyan-700" },
  VISIT_DONE: { label: "Visit Done", color: "bg-teal-100 text-teal-700" },
  NEGOTIATION: { label: "Negotiation", color: "bg-orange-100 text-orange-700" },
  CLOSED_WON: { label: "Closed Won", color: "bg-green-100 text-green-700" },
  CLOSED_LOST: { label: "Closed Lost", color: "bg-red-100 text-red-700" },
  PAUSED: { label: "Paused", color: "bg-gray-100 text-gray-600" },
};

export const DEAL_STAGES = [
  "REQUIREMENT_QUALIFIED",
  "SHORTLIST_ACCEPTED",
  "VISIT_DONE",
  "NEGOTIATING_TERMS",
  "DOCUMENTATION",
  "LEASE_SIGNED",
  "MOVED_IN",
  "LOST",
] as const;

export const PRIORITY_META: Record<string, { label: string; dot: string }> = {
  hot: { label: "Hot", dot: "bg-red-500" },
  warm: { label: "Warm", dot: "bg-amber-500" },
  cold: { label: "Cold", dot: "bg-sky-500" },
};

export const AMENITIES = [
  "Parking",
  "24/7 Access",
  "IT Infrastructure",
  "Cafeteria",
  "Meeting Rooms",
  "Reception",
  "Housekeeping",
  "Power Backup",
  "Security",
  "Metro Nearby",
  "Breakout Zones",
  "Phone Booths",
] as const;
