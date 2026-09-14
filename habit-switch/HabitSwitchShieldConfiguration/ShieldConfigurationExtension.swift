import ManagedSettings
import ManagedSettingsUI
import UIKit

final class ShieldConfigurationExtension: ShieldConfigurationDataSource {
    override func configuration(shielding application: Application) -> ShieldConfiguration {
        makeConfiguration()
    }

    override func configuration(
        shielding application: Application,
        in category: ActivityCategory
    ) -> ShieldConfiguration {
        makeConfiguration()
    }

    private func makeConfiguration() -> ShieldConfiguration {
        let rule = HabitSwitchStore.loadRule()
        let title = ShieldConfiguration.Label(
            text: "いったん、こっちへ",
            color: .label
        )
        let subtitle = ShieldConfiguration.Label(
            text: "\(rule.launchTitle)を\(rule.requiredLearningMinutes)分使うと、\(rule.unlockMinutes)分だけ開けます。",
            color: .secondaryLabel
        )
        let primary = ShieldConfiguration.Label(
            text: "学習する",
            color: .white
        )
        let secondary = ShieldConfiguration.Label(
            text: "今回はやめる",
            color: .secondaryLabel
        )

        return ShieldConfiguration(
            backgroundBlurStyle: .systemMaterial,
            backgroundColor: .systemBackground,
            icon: UIImage(systemName: "book.fill"),
            title: title,
            subtitle: subtitle,
            primaryButtonLabel: primary,
            primaryButtonBackgroundColor: .systemBlue,
            secondaryButtonLabel: secondary
        )
    }
}
