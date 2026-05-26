export type UseCaseId = "residential" | "commercial" | "industrial" | "interior";
export type BuilderType = "contract-construction" | "joint-venture" | "interior" | "reconstruction";
export type LandownerType = BuilderType;

export type CardTheme = {
  // Gradient used by the 3D glow + subtle accents.
  glowGradientClassName: string;
  // Gradient used for header/background accents.
  accentGradientClassName: string;
  // Optional badge ribbon position style hint.
  headerVariant: "topBar" | "cornerRibbon" | "floatingIcon";
  // Icon background gradient for the header area.
  iconBgGradientClassName: string;
};

const themesByKey: Record<string, CardTheme> = {
  residential: {
    glowGradientClassName: "from-primary/30 to-accent/30",
    accentGradientClassName: "bg-gradient-to-br from-primary/15 to-accent/10",
    headerVariant: "topBar",
    iconBgGradientClassName: "from-primary/20 to-accent/20",
  },
  commercial: {
    glowGradientClassName: "from-accent/30 to-primary/30",
    accentGradientClassName: "bg-gradient-to-br from-accent/15 to-primary/10",
    headerVariant: "cornerRibbon",
    iconBgGradientClassName: "from-accent/20 to-primary/20",
  },
  industrial: {
    glowGradientClassName: "from-primary/25 to-primary/5",
    accentGradientClassName: "bg-gradient-to-br from-primary/15 to-accent/5",
    headerVariant: "floatingIcon",
    iconBgGradientClassName: "from-primary/20 to-primary/10",
  },
  interior: {
    glowGradientClassName: "from-accent/25 to-accent/5",
    accentGradientClassName: "bg-gradient-to-br from-accent/15 to-primary/5",
    headerVariant: "floatingIcon",
    iconBgGradientClassName: "from-accent/20 to-primary/10",
  },

  "contract-construction": {
    glowGradientClassName: "from-primary/30 to-accent/20",
    accentGradientClassName: "bg-gradient-to-br from-primary/15 to-accent/10",
    headerVariant: "topBar",
    iconBgGradientClassName: "from-primary/20 to-accent/20",
  },
  "joint-venture": {
    glowGradientClassName: "from-accent/30 to-primary/20",
    accentGradientClassName: "bg-gradient-to-br from-accent/15 to-primary/10",
    headerVariant: "cornerRibbon",
    iconBgGradientClassName: "from-accent/20 to-primary/20",
  },
  reconstruction: {
    glowGradientClassName: "from-primary/20 to-accent/20",
    accentGradientClassName: "bg-gradient-to-br from-primary/10 to-accent/10",
    headerVariant: "floatingIcon",
    iconBgGradientClassName: "from-primary/20 to-accent/10",
  },
};

export function getUseCaseTheme(id: UseCaseId): CardTheme {
  return themesByKey[id];
}

export function getBuilderTheme(id: BuilderType): CardTheme {
  return themesByKey[id];
}

export function getLandownerTheme(id: LandownerType): CardTheme {
  return themesByKey[id];
}

