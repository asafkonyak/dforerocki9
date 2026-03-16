import { createBrowserRouter } from "react-router";
import { ThemeSelector } from "./screens/ThemeSelector";
import { WelcomeScreen } from "./screens/WelcomeScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { LoginTransitionScreen } from "./screens/LoginTransitionScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { PlayerSetupScreen } from "./screens/PlayerSetupScreen";
import { MainMenuScreen } from "./screens/MainMenuScreen";
import { MatchmakingScreen } from "./screens/MatchmakingScreen";
import { VersusScreen } from "./screens/VersusScreen";
import { GameScreen } from "./screens/GameScreen";
import { LeaderboardScreen } from "./screens/LeaderboardScreen";
import { TrainingSimulatorScreen } from "./screens/TrainingSimulatorScreen";
import { EnduranceBattleScreen } from "./screens/EnduranceBattleScreen";
import { ExplosiveBattleScreen } from "./screens/ExplosiveBattleScreen";
import { StrengthBattleScreen } from "./screens/StrengthBattleScreen";
import { GauntletScreen } from "./screens/GauntletScreen";
import { VictoryAnalyticsScreen } from "./screens/VictoryAnalyticsScreen";
import { SFWelcomeScreen } from "./screens/sf/SFWelcomeScreen";
import { SFOnboardingScreen } from "./screens/sf/SFOnboardingScreen";
import { SFMainMenuScreen } from "./screens/sf/SFMainMenuScreen";
import { SFMatchmakingScreen } from "./screens/sf/SFMatchmakingScreen";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: ThemeSelector,
  },
  // Cyberpunk themed routes
  {
    path: "/cyber",
    Component: WelcomeScreen,
  },
  {
    path: "/login",
    Component: LoginScreen,
  },
  {
    path: "/login-transition",
    Component: LoginTransitionScreen,
  },
  {
    path: "/onboarding",
    Component: OnboardingScreen,
  },
  {
    path: "/setup",
    Component: PlayerSetupScreen,
  },
  {
    path: "/menu",
    Component: MainMenuScreen,
  },
  {
    path: "/matchmaking",
    Component: MatchmakingScreen,
  },
  {
    path: "/versus",
    Component: VersusScreen,
  },
  {
    path: "/game",
    Component: GameScreen,
  },
  {
    path: "/leaderboard",
    Component: LeaderboardScreen,
  },
  {
    path: "/training",
    Component: TrainingSimulatorScreen,
  },
  {
    path: "/training/endurance",
    Component: EnduranceBattleScreen,
  },
  {
    path: "/training/explosive",
    Component: ExplosiveBattleScreen,
  },
  {
    path: "/training/strength",
    Component: StrengthBattleScreen,
  },
  {
    path: "/gauntlet",
    Component: GauntletScreen,
  },
  {
    path: "/victory",
    Component: VictoryAnalyticsScreen,
  },
  // Street Fighter themed routes
  {
    path: "/sf",
    Component: SFWelcomeScreen,
  },
  {
    path: "/sf/onboarding",
    Component: SFOnboardingScreen,
  },
  {
    path: "/sf/menu",
    Component: SFMainMenuScreen,
  },
  {
    path: "/sf/matchmaking",
    Component: SFMatchmakingScreen,
  },
]);