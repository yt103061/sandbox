import SwiftUI
import UIKit
import FamilyControls
import DeviceActivity
import ManagedSettings

@MainActor
final class ScreenTimeController: ObservableObject {
    @Published var rule: RuleConfiguration
    @Published var runtime: RuntimeState
    @Published var isAuthorized = false
    @Published var authorizationError: String?
    @Published var monitoringError: String?
    @Published var shouldShowIntervention = false

    private let activityCenter = DeviceActivityCenter()

    init() {
        self.rule = HabitSwitchStore.loadRule()
        self.runtime = HabitSwitchStore.loadRuntime()
        refresh()
    }

    func refresh() {
        rule = HabitSwitchStore.loadRule()
        runtime = HabitSwitchStore.loadRuntime()
        isAuthorized = AuthorizationCenter.shared.authorizationStatus == .approved
        shouldShowIntervention = runtime.pendingIntervention
        ShieldEnforcer.sync()
    }

    func requestAuthorization() async {
        do {
            try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
            authorizationError = nil
        } catch {
            authorizationError = error.localizedDescription
        }
        refresh()
    }

    func saveRule() {
        rule.requiredLearningMinutes = max(1, min(rule.requiredLearningMinutes, 60))
        rule.unlockMinutes = max(15, min(rule.unlockMinutes, 120))
        HabitSwitchStore.saveRule(rule)
        ShieldEnforcer.sync()
        refresh()
    }

    func dismissPendingIntervention() {
        HabitSwitchStore.mutateRuntime { state in
            state.pendingIntervention = false
        }
        refresh()
    }

    func startLearningAndOpenReplacement() {
        monitoringError = nil

        guard rule.isReady else {
            monitoringError = "ルール設定が未完了です。"
            return
        }
        guard let url = URL(string: rule.launchURLString) else {
            monitoringError = "起動先URLが正しくありません。"
            return
        }

        activityCenter.stopMonitoring([.habitSwitchLearning])

        let now = Date()
        guard let monitoringEnd = Calendar.current.date(byAdding: .hour, value: 23, to: now) else {
            monitoringError = "監視時間を作成できませんでした。"
            return
        }

        let schedule = DeviceActivitySchedule(
            intervalStart: calendarComponents(for: now),
            intervalEnd: calendarComponents(for: monitoringEnd),
            repeats: false
        )

        let event = DeviceActivityEvent(
            applications: rule.learningSelection.applicationTokens,
            threshold: DateComponents(minute: rule.requiredLearningMinutes),
            includesPastActivity: false
        )

        do {
            try activityCenter.startMonitoring(
                .habitSwitchLearning,
                during: schedule,
                events: [.habitSwitchLearningThreshold: event]
            )

            HabitSwitchStore.mutateRuntime { state in
                state.pendingIntervention = false
                state.learningSessionStartedAt = now
                state.learningStartedCount += 1
            }
            refresh()

            UIApplication.shared.open(url, options: [:]) { [weak self] success in
                Task { @MainActor in
                    if !success {
                        self?.monitoringError = "\(self?.rule.launchTitle ?? "学習アプリ")を開けませんでした。URL設定を確認してください。"
                    }
                }
            }
        } catch {
            monitoringError = error.localizedDescription
        }
    }

    func forceRelock() {
        activityCenter.stopMonitoring([.habitSwitchUnlock, .habitSwitchLearning])
        HabitSwitchStore.mutateRuntime { state in
            state.pendingIntervention = false
            state.learningSessionStartedAt = nil
            state.unlockUntil = nil
        }
        ShieldEnforcer.sync()
        refresh()
    }

    private func calendarComponents(for date: Date) -> DateComponents {
        Calendar.current.dateComponents([.hour, .minute, .second], from: date)
    }
}
