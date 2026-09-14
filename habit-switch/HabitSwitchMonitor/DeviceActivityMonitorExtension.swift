import Foundation
import DeviceActivity

final class DeviceActivityMonitorExtension: DeviceActivityMonitor {
    override func eventDidReachThreshold(
        _ event: DeviceActivityEvent.Name,
        activity: DeviceActivityName
    ) {
        super.eventDidReachThreshold(event, activity: activity)

        guard activity == .habitSwitchLearning,
              event == .habitSwitchLearningThreshold else { return }

        let rule = HabitSwitchStore.loadRule()
        let runtime = HabitSwitchStore.loadRuntime()
        let now = Date()

        // iOS 26系でthreshold callbackが即時発火する報告への最低限の防御。
        // 正常系では「対象アプリの前面利用時間」と「経過実時間」の両方が必要になる。
        if let startedAt = runtime.learningSessionStartedAt {
            let minimumWallClock = TimeInterval(max(1, rule.requiredLearningMinutes) * 60 - 5)
            guard now.timeIntervalSince(startedAt) >= minimumWallClock else {
                return
            }
        }

        let unlockUntil = now.addingTimeInterval(TimeInterval(rule.unlockMinutes * 60))
        HabitSwitchStore.mutateRuntime { state in
            state.learningSessionStartedAt = nil
            state.pendingIntervention = false
            state.unlockUntil = unlockUntil
            state.successfulUnlockCount += 1
        }

        ShieldEnforcer.clear()
        scheduleRelock(until: unlockUntil)
    }

    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)

        guard activity == .habitSwitchUnlock else { return }

        HabitSwitchStore.mutateRuntime { state in
            state.unlockUntil = nil
        }
        ShieldEnforcer.sync()
    }

    private func scheduleRelock(until end: Date) {
        let now = Date()
        let calendar = Calendar.current
        let startComponents = calendar.dateComponents([.hour, .minute, .second], from: now)
        let endComponents = calendar.dateComponents([.hour, .minute, .second], from: end)

        let schedule = DeviceActivitySchedule(
            intervalStart: startComponents,
            intervalEnd: endComponents,
            repeats: false
        )

        let center = DeviceActivityCenter()
        center.stopMonitoring([.habitSwitchUnlock])

        do {
            try center.startMonitoring(.habitSwitchUnlock, during: schedule)
        } catch {
            // 解除状態自体はApp Groupに残す。次回アプリ起動時のsync()でも再ロックされる。
        }
    }
}
