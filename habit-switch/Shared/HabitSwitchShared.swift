import Foundation
import FamilyControls
import ManagedSettings
import DeviceActivity

// MARK: - Shared identifiers

enum HabitSwitchConstants {
    static let appGroup = "group.com.yt103061.habitswitch"
    static let ruleKey = "habit-switch.rule"
    static let runtimeKey = "habit-switch.runtime"
}

extension ManagedSettingsStore.Name {
    static let habitSwitch = Self("habit-switch")
}

extension DeviceActivityName {
    static let habitSwitchLearning = Self("habit-switch.learning")
    static let habitSwitchUnlock = Self("habit-switch.unlock")
}

extension DeviceActivityEvent.Name {
    static let habitSwitchLearningThreshold = Self("habit-switch.learning.threshold")
}

// MARK: - Rule

enum LaunchPreset: String, Codable, CaseIterable, Identifiable {
    case kindle
    case goail
    case newsPicks
    case appleBooks
    case custom

    var id: String { rawValue }

    var title: String {
        switch self {
        case .kindle: return "Kindle"
        case .goail: return "Goail"
        case .newsPicks: return "NewsPicks"
        case .appleBooks: return "Apple Books"
        case .custom: return "カスタム"
        }
    }

    var defaultURLString: String {
        switch self {
        case .kindle: return "kindle://"
        case .goail: return "golail://current"
        case .newsPicks: return "https://newspicks.com/"
        case .appleBooks: return "ibooks://"
        case .custom: return ""
        }
    }
}

struct RuleConfiguration: Codable, Equatable {
    var blockedSelection = FamilyActivitySelection()
    var learningSelection = FamilyActivitySelection()
    var launchPreset: LaunchPreset = .kindle
    var customLaunchName = ""
    var customLaunchURL = ""
    var requiredLearningMinutes = 5
    var unlockMinutes = 15
    var enabled = false

    var launchTitle: String {
        launchPreset == .custom && !customLaunchName.isEmpty ? customLaunchName : launchPreset.title
    }

    var launchURLString: String {
        launchPreset == .custom ? customLaunchURL : launchPreset.defaultURLString
    }

    var isReady: Bool {
        enabled
        && !blockedSelection.applicationTokens.isEmpty
        && !learningSelection.applicationTokens.isEmpty
        && URL(string: launchURLString) != nil
    }
}

// MARK: - Runtime state

struct RuntimeState: Codable, Equatable {
    var pendingIntervention = false
    var learningSessionStartedAt: Date?
    var unlockUntil: Date?

    var metricDay = Self.dayKey(for: Date())
    var interceptedCount = 0
    var learningStartedCount = 0
    var successfulUnlockCount = 0

    mutating func normalizeDay(now: Date = Date()) {
        let key = Self.dayKey(for: now)
        guard key != metricDay else { return }
        metricDay = key
        interceptedCount = 0
        learningStartedCount = 0
        successfulUnlockCount = 0
    }

    static func dayKey(for date: Date) -> String {
        let formatter = DateFormatter()
        formatter.calendar = .current
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }
}

// MARK: - App Group storage

enum HabitSwitchStore {
    private static var defaults: UserDefaults {
        guard let defaults = UserDefaults(suiteName: HabitSwitchConstants.appGroup) else {
            fatalError("HabitSwitch App Group is not configured")
        }
        return defaults
    }

    static func loadRule() -> RuleConfiguration {
        guard let data = defaults.data(forKey: HabitSwitchConstants.ruleKey),
              let value = try? JSONDecoder().decode(RuleConfiguration.self, from: data) else {
            return RuleConfiguration()
        }
        return value
    }

    static func saveRule(_ rule: RuleConfiguration) {
        guard let data = try? JSONEncoder().encode(rule) else { return }
        defaults.set(data, forKey: HabitSwitchConstants.ruleKey)
    }

    static func loadRuntime() -> RuntimeState {
        guard let data = defaults.data(forKey: HabitSwitchConstants.runtimeKey),
              var value = try? JSONDecoder().decode(RuntimeState.self, from: data) else {
            return RuntimeState()
        }
        value.normalizeDay()
        return value
    }

    static func saveRuntime(_ runtime: RuntimeState) {
        guard let data = try? JSONEncoder().encode(runtime) else { return }
        defaults.set(data, forKey: HabitSwitchConstants.runtimeKey)
    }

    static func mutateRuntime(_ mutation: (inout RuntimeState) -> Void) {
        var runtime = loadRuntime()
        runtime.normalizeDay()
        mutation(&runtime)
        saveRuntime(runtime)
    }
}

// MARK: - Shield enforcement

enum ShieldEnforcer {
    private static let store = ManagedSettingsStore(named: .habitSwitch)

    static func sync(now: Date = Date()) {
        let rule = HabitSwitchStore.loadRule()
        let runtime = HabitSwitchStore.loadRuntime()

        guard rule.enabled else {
            clear()
            return
        }

        if let unlockUntil = runtime.unlockUntil, unlockUntil > now {
            clear()
            return
        }

        let tokens = rule.blockedSelection.applicationTokens
        store.shield.applications = tokens.isEmpty ? nil : tokens
    }

    static func clear() {
        store.shield.applications = nil
    }
}
