import UserNotifications

class NotificationManager {
    static let shared = NotificationManager()
    private init() {}

    func requestPermission() async -> Bool {
        let center = UNUserNotificationCenter.current()
        let granted = try? await center.requestAuthorization(options: [.alert, .sound, .badge])
        return granted ?? false
    }

    func scheduleStageChangeNotification(characterName: String, stageName: String) {
        let content = UNMutableNotificationContent()
        content.title = "\(characterName)???愿怨꾧? 蹂?덉뼱??
        content.body = "?덈줈???④퀎: \(stageName)"
        content.sound = .default

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(
            identifier: "stage-\(UUID())",
            content: content,
            trigger: trigger
        )
        UNUserNotificationCenter.current().add(request)
    }

    func schedulePhaseTransitionNotification(characterName: String, phase: RelationshipPhase) {
        let content = UNMutableNotificationContent()
        content.title = "\(characterName)??媛먯젙??蹂?덉뼱??
        content.body = "?꾩옱 ?곹깭: \(phase.displayName)"
        content.sound = .default

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(
            identifier: "phase-\(UUID())",
            content: content,
            trigger: trigger
        )
        UNUserNotificationCenter.current().add(request)
    }
}