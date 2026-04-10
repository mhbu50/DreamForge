import { AppConfig } from "../types";

const CONFIG_KEY = "dreamforge_config";

const DEFAULT_CONFIG: AppConfig = {
  writing: {
    distractionFree: false,
    typewriterMode: false,
    ambientSound: "none",
    ambientVolume: 50,
    pomodoroEnabled: false,
    pomodoroWorkTime: 25,
    pomodoroBreakTime: 5
  },
  ui: {
    theme: "modern",
    fontSize: 16,
    lineHeight: 1.6,
    maxWidth: 800
  },
  security: {
    appLockEnabled: false,
    stealthMode: false,
    autoSaveInterval: 60
  },
  accessibility: {
    simplifiedSyntaxMode: false,
    highContrast: false,
    dyslexicFont: false
  }
};

export const ConfigService = {
  getConfig(): AppConfig {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (!saved) return DEFAULT_CONFIG;
    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch {
      return DEFAULT_CONFIG;
    }
  },

  saveConfig(config: AppConfig): void {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  },

  updateConfig(updates: Partial<AppConfig>): AppConfig {
    const current = this.getConfig();
    const updated = { ...current, ...updates };
    this.saveConfig(updated);
    return updated;
  }
};
