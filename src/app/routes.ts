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
import { PregameScreen } from "./screens/PregameScreen";
import { SingleGameScreen } from "./screens/SingleGameScreen";
import { OneVsOnePregameScreen } from "./screens/OneVsOnePregameScreen";
import { OneVsOneGameScreen } from "./screens/OneVsOneGameScreen";
import { MatchVictoryScreen } from "./screens/MatchVictoryScreen";
import { SystemSettingsScreen } from "./screens/SystemSettingsScreen";

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
    path: "/single-game",
    Component: SingleGameScreen,
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
    path: "/practice",
    Component: GauntletScreen,
  },
  {
    path: "/victory",
    Component: VictoryAnalyticsScreen,
  },
  {
    path: "/pregame",
    Component: PregameScreen,
  },
  {
    path: "/1v1-pregame",
    Component: OneVsOnePregameScreen,
  },
  {
    path: "/1v1-game",
    Component: OneVsOneGameScreen,
  },
  {
    path: "/1v1victory",
    Component: MatchVictoryScreen,
  },
  {
    path: "/1v1practice",
    Component: OneVsOneGameScreen, // Reuse 1v1 game for practice
  },
  {
    path: "/settings",
    Component: SystemSettingsScreen,
  },
]);