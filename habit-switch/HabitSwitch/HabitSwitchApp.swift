import SwiftUI

@main
struct HabitSwitchApp: App {
    @StateObject private var controller = ScreenTimeController()
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(controller)
                .onAppear {
                    controller.refresh()
                }
                .onChange(of: scenePhase) { _, newPhase in
                    if newPhase == .active {
                        controller.refresh()
                    }
                }
        }
    }
}
