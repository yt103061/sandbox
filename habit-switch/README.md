# HabitSwitch

自分専用の「誘惑アプリ → 学習アプリ」置換ツールです。

## MVPでできること

- iPhone上の「減らしたいアプリ」を FamilyActivityPicker で選択
- 「学習としてカウントするアプリ」を別途選択
- Kindle / Goail / NewsPicks / Apple Books / 任意URLを代替起動先として設定
- 減らしたいアプリは ManagedSettings の Shield でロック
- Shield の「学習する」から HabitSwitch を開く（iOS 26.5+）
- HabitSwitch から代替アプリを起動
- 代替アプリを設定時間使うと DeviceActivityMonitor が検知して、減らしたいアプリを一時解放
- 解放時間終了後に再度 Shield
- 今日の「ブロック遭遇」「学習開始」「解除成功」を簡易記録

## 技術構成

- SwiftUI
- FamilyControls
- ManagedSettings / ManagedSettingsUI
- DeviceActivity
- App Group
- XcodeGen

## 前提

このMVPは **iOS 26.5+ の実機専用**です。`ShieldActionResponse.openParentalControlsApp` を使い、Shieldから制御アプリを正規APIで開きます。

Screen Time系APIは実機でしか正しく検証できません。また、2026年時点で `DeviceActivityMonitor.eventDidReachThreshold` にはOSバージョン依存の不安定さが報告されているため、本MVPでは最初に実機検証すべきポイントとして扱います。

## セットアップ

1. XcodeGen を用意
2. このディレクトリで `xcodegen generate`
3. `HabitSwitch.xcodeproj` を開く
4. Main app と3つのExtensionで Signing Teamを自分のApple Developer Teamに設定
5. App Group `group.com.yt103061.habitswitch` が全ターゲットで有効か確認
6. Family Controls capability が全ターゲットで有効か確認
7. 実機へインストール
8. 初回起動でScreen Time権限を許可

## 初回のおすすめ設定

- 減らしたいアプリ: YouTube + 漫画アプリ
- 学習としてカウント: Kindle
- 起動先: Kindle
- 必要学習時間: 5分
- 解放時間: 15分

## Goail

Goailは既存実装の `golail://current` を起動先として登録しています。

## NewsPicks

NewsPicksは公開URL Schemeを前提にせず `https://newspicks.com/` を使っています。端末側のUniversal Link設定次第ではSafariに開くため、実機で確認してください。

## 既知の制約

- 他社アプリを強制終了することはできません。Shieldでアクセスを遮断します。
- FamilyActivityPickerで選んだアプリtokenから、そのアプリを任意起動することはできません。起動先はURL Scheme / Universal Linkで別途定義します。
- 「学習としてカウントするアプリ」と「起動先」はMVPでは別設定です。同じアプリを選んでください。
- 代替アプリを本当に読んでいるかまでは判定できず、前面利用時間を学習時間として扱います。
- iOS 26系ではDeviceActivity thresholdの不具合報告があるため、実機で挙動確認が必要です。

## 次の検証

まず1週間、以下だけ見ます。

1. YouTube/漫画を開こうとした回数
2. そのうち学習アプリへ移った回数
3. 学習5分を達成した回数
4. YouTube/漫画の総利用時間が減ったか
5. Kindle/Goailの利用時間が増えたか

機能追加より先に、この置換ループ自体が自分の行動を変えるかを検証します。
