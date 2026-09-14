import SwiftUI
import FamilyControls

struct ContentView: View {
    @EnvironmentObject private var controller: ScreenTimeController

    var body: some View {
        TabView {
            TodayView()
                .tabItem { Label("今日", systemImage: "chart.bar") }

            RuleView()
                .tabItem { Label("ルール", systemImage: "arrow.triangle.2.circlepath") }
        }
        .sheet(isPresented: $controller.shouldShowIntervention) {
            InterventionView()
                .environmentObject(controller)
                .interactiveDismissDisabled()
        }
    }
}

private struct TodayView: View {
    @EnvironmentObject private var controller: ScreenTimeController

    var body: some View {
        NavigationStack {
            List {
                Section("今日") {
                    metric("ブロックに遭遇", controller.runtime.interceptedCount, "hand.raised")
                    metric("学習を開始", controller.runtime.learningStartedCount, "book")
                    metric("解除成功", controller.runtime.successfulUnlockCount, "checkmark.circle")
                }

                if let unlockUntil = controller.runtime.unlockUntil, unlockUntil > Date() {
                    Section("現在") {
                        LabeledContent("誘惑アプリ") {
                            Text("解放中")
                                .foregroundStyle(.green)
                        }
                        LabeledContent("再ロック") {
                            Text(unlockUntil, style: .timer)
                        }
                        Button("今すぐ再ロック", role: .destructive) {
                            controller.forceRelock()
                        }
                    }
                } else {
                    Section("現在") {
                        LabeledContent("誘惑アプリ") {
                            Text(controller.rule.enabled ? "ロック中" : "ルール停止中")
                        }
                    }
                }

                Section {
                    Text("成功指標は連続日数ではなく、誘惑アプリを開こうとした瞬間が学習開始に何回置き換わったかです。")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("HabitSwitch")
            .toolbar {
                Button {
                    controller.refresh()
                } label: {
                    Image(systemName: "arrow.clockwise")
                }
            }
        }
    }

    private func metric(_ title: String, _ value: Int, _ systemImage: String) -> some View {
        HStack {
            Label(title, systemImage: systemImage)
            Spacer()
            Text("\(value)回")
                .font(.headline.monospacedDigit())
        }
    }
}

private struct RuleView: View {
    @EnvironmentObject private var controller: ScreenTimeController
    @State private var picker: PickerTarget?

    enum PickerTarget: Identifiable {
        case blocked
        case learning
        var id: Int { self == .blocked ? 0 : 1 }
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Screen Time権限") {
                    HStack {
                        Text("状態")
                        Spacer()
                        Text(controller.isAuthorized ? "許可済み" : "未許可")
                            .foregroundStyle(controller.isAuthorized ? .green : .secondary)
                    }
                    if !controller.isAuthorized {
                        Button("権限を許可") {
                            Task { await controller.requestAuthorization() }
                        }
                    }
                    if let error = controller.authorizationError {
                        Text(error)
                            .font(.footnote)
                            .foregroundStyle(.red)
                    }
                }

                Section("減らしたいアプリ") {
                    Button("アプリを選ぶ") { picker = .blocked }
                    LabeledContent("選択数", value: "\(controller.rule.blockedSelection.applicationTokens.count)")
                    Text("YouTube、漫画、SNSなど。選んだアプリにはShieldをかけます。")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                Section("増やしたいアプリ") {
                    Button("学習としてカウントするアプリを選ぶ") { picker = .learning }
                    LabeledContent("選択数", value: "\(controller.rule.learningSelection.applicationTokens.count)")
                    Text("通常は起動先と同じアプリを選びます。例: Kindleを起動するならKindleを選択。")
                        .font(.footnote)
                        .foregroundStyle(.secondary)

                    Picker("起動先", selection: $controller.rule.launchPreset) {
                        ForEach(LaunchPreset.allCases) { preset in
                            Text(preset.title).tag(preset)
                        }
                    }

                    if controller.rule.launchPreset == .custom {
                        TextField("表示名", text: $controller.rule.customLaunchName)
                        TextField("URL / URL Scheme", text: $controller.rule.customLaunchURL)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                    } else {
                        LabeledContent("起動URL", value: controller.rule.launchURLString)
                            .font(.footnote)
                    }
                }

                Section("交換レート") {
                    Stepper(
                        "学習 \(controller.rule.requiredLearningMinutes)分",
                        value: $controller.rule.requiredLearningMinutes,
                        in: 1...60
                    )
                    Stepper(
                        "解放 \(controller.rule.unlockMinutes)分",
                        value: $controller.rule.unlockMinutes,
                        in: 15...120,
                        step: 5
                    )
                }

                Section {
                    Toggle("ルールを有効にする", isOn: $controller.rule.enabled)
                    Button("保存して適用") {
                        controller.saveRule()
                    }
                    .disabled(!controller.isAuthorized)
                }

                if let error = controller.monitoringError {
                    Section("エラー") {
                        Text(error)
                            .foregroundStyle(.red)
                    }
                }
            }
            .navigationTitle("ルール")
            .sheet(item: $picker) { target in
                NavigationStack {
                    Group {
                        switch target {
                        case .blocked:
                            FamilyActivityPicker(selection: $controller.rule.blockedSelection)
                        case .learning:
                            FamilyActivityPicker(selection: $controller.rule.learningSelection)
                        }
                    }
                    .navigationTitle(target == .blocked ? "減らしたいアプリ" : "学習アプリ")
                    .toolbar {
                        ToolbarItem(placement: .confirmationAction) {
                            Button("完了") { picker = nil }
                        }
                    }
                }
            }
        }
    }
}

private struct InterventionView: View {
    @EnvironmentObject private var controller: ScreenTimeController

    var body: some View {
        NavigationStack {
            VStack(spacing: 28) {
                Spacer()

                Image(systemName: "arrow.right.circle.fill")
                    .font(.system(size: 58))
                    .symbolRenderingMode(.hierarchical)

                VStack(spacing: 10) {
                    Text("いったん、こっちへ")
                        .font(.title.bold())
                    Text("\(controller.rule.launchTitle)を\(controller.rule.requiredLearningMinutes)分使うと、元のアプリを\(controller.rule.unlockMinutes)分だけ開けます。")
                        .multilineTextAlignment(.center)
                        .foregroundStyle(.secondary)
                }

                Button {
                    controller.startLearningAndOpenReplacement()
                } label: {
                    Text("\(controller.rule.launchTitle)を開く")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                }
                .buttonStyle(.borderedProminent)

                Button("今回はやめる") {
                    controller.dismissPendingIntervention()
                }
                .buttonStyle(.plain)
                .foregroundStyle(.secondary)

                if let error = controller.monitoringError {
                    Text(error)
                        .font(.footnote)
                        .foregroundStyle(.red)
                }

                Spacer()
            }
            .padding(24)
            .navigationTitle("HabitSwitch")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}
