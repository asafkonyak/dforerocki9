import { lazy } from "react";
import { createBrowserRouter } from "react-router";

// Lazy-loaded components
const ThemeSelector = lazy(() => import("./screens/ThemeSelector").then(m => ({ default: m.ThemeSelector })));
const WelcomeScreen = lazy(() => import("./screens/WelcomeScreen").then(m => ({ default: m.WelcomeScreen })));
const LoginScreen = lazy(() => import("./screens/LoginScreen").then(m => ({ default: m.LoginScreen })));
const LoginTransitionScreen = lazy(() => import("./screens/LoginTransitionScreen").then(m => ({ default: m.LoginTransitionScreen })));
const OnboardingScreen = lazy(() => import("./screens/OnboardingScreen").then(m => ({ default: m.OnboardingScreen })));
const PlayerSetupScreen = lazy(() => import("./screens/PlayerSetupScreen").then(m => ({ default: m.PlayerSetupScreen })));
const MainMenuScreen = lazy(() => import("./screens/MainMenuScreen").then(m => ({ default: m.MainMenuScreen })));
const MatchmakingScreen = lazy(() => import("./screens/MatchmakingScreen").then(m => ({ default: m.MatchmakingScreen })));
const VersusScreen = lazy(() => import("./screens/VersusScreen").then(m => ({ default: m.VersusScreen })));
const GameScreen = lazy(() => import("./screens/GameScreen").then(m => ({ default: m.GameScreen })));
const LeaderboardScreen = lazy(() => import("./screens/LeaderboardScreen").then(m => ({ default: m.LeaderboardScreen })));
const TrainingSimulatorScreen = lazy(() => import("./screens/TrainingSimulatorScreen").then(m => ({ default: m.TrainingSimulatorScreen })));
const EnduranceBattleScreen = lazy(() => import("./screens/EnduranceBattleScreen").then(m => ({ default: m.EnduranceBattleScreen })));
const ExplosiveBattleScreen = lazy(() => import("./screens/ExplosiveBattleScreen").then(m => ({ default: m.ExplosiveBattleScreen })));
const StrengthBattleScreen = lazy(() => import("./screens/StrengthBattleScreen").then(m => ({ default: m.StrengthBattleScreen })));
const GauntletScreen = lazy(() => import("./screens/GauntletScreen").then(m => ({ default: m.GauntletScreen })));
const VictoryAnalyticsScreen = lazy(() => import("./screens/VictoryAnalyticsScreen").then(m => ({ default: m.VictoryAnalyticsScreen })));
const PregameScreen = lazy(() => import("./screens/PregameScreen").then(m => ({ default: m.PregameScreen })));
const SingleGameScreen = lazy(() => import("./screens/SingleGameScreen").then(m => ({ default: m.SingleGameScreen })));
const OneVsOnePregameScreen = lazy(() => import("./screens/OneVsOnePregameScreen").then(m => ({ default: m.OneVsOnePregameScreen })));
const OneVsOneGameScreen = lazy(() => import("./screens/OneVsOneGameScreen").then(m => ({ default: m.OneVsOneGameScreen })));
const MatchVictoryScreen = lazy(() => import("./screens/MatchVictoryScreen").then(m => ({ default: m.MatchVictoryScreen })));
const SystemSettingsScreen = lazy(() => import("./screens/SystemSettingsScreen").then(m => ({ default: m.SystemSettingsScreen })));

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