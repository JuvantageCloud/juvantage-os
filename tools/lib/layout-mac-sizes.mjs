export const MAC = {
  desktop: { w: 980, h: 680 },
  sheet: { w: 340, h: 560 },
  solo: { w: 1024, h: 640 },
  tray: { w: 280, h: 320 },
  bridge: { w: 980, h: 680 },
};

/** Full OS_UI_MAP surface — every layout pack renders all of these. */
export const APP_SCREENS = [
  { id: "25-sign-in", map: "25", title: "Sign-in gate", kind: "desktop", ...MAC.desktop },
  { id: "16-connect", map: "16", title: "Connectors (Google)", kind: "desktop", ...MAC.desktop },
  { id: "01-agent-idle", map: "01", title: "Agent idle", kind: "solo", ...MAC.solo },
  { id: "02-agent-nudge", map: "02", title: "Agent nudge", kind: "solo", ...MAC.solo },
  { id: "03-sheet-empty", map: "03", title: "Quick sheet empty", kind: "sheet", ...MAC.sheet },
  { id: "05-sheet-draft", map: "05", title: "Quick sheet draft", kind: "sheet", ...MAC.sheet },
  { id: "06-sheet-closed", map: "06", title: "Sheet closed", kind: "sheet", ...MAC.sheet },
  { id: "07-bridge", map: "07", title: "Bridge sheet → Desktop", kind: "bridge", ...MAC.bridge },
  { id: "08-work-home", map: "08", title: "Work home (layout core)", kind: "desktop", ...MAC.desktop, core: true },
  { id: "11-evidence", map: "11", title: "Evidence / context pack", kind: "desktop", ...MAC.desktop },
  { id: "12-context", map: "12", title: "Context last 4h", kind: "desktop", ...MAC.desktop },
  { id: "14-synced", map: "14–15", title: "Synced mail + calendar", kind: "desktop", ...MAC.desktop },
  { id: "17-settings", map: "17–18", title: "Settings general + quiet", kind: "desktop", ...MAC.desktop },
  { id: "19-privacy", map: "19", title: "Privacy + retention", kind: "desktop", ...MAC.desktop },
  { id: "21-audit", map: "21–22", title: "Audit + disclosure", kind: "desktop", ...MAC.desktop },
  { id: "23-tray", map: "23", title: "Menu bar tray", kind: "tray", ...MAC.tray },
  { id: "sheet-screen", map: "—", title: "Screen note sheet", kind: "sheet", ...MAC.sheet },
  { id: "sheet-voice", map: "—", title: "Voice loop sheet", kind: "sheet", ...MAC.sheet },
];