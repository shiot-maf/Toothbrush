import SwiftUI

enum RelationshipPhase: String, Codable, CaseIterable {
    case normal = "normal"
    case marriage = "marriage"
    case breakup = "breakup"
    case breakupReconciling = "breakup_reconciling"
    case crisis = "crisis"
    case crisisResolved = "crisis_resolved"
    case eternalLove = "eternal_love"

    var displayName: String {
        switch self {
        case .normal: return "?쇰컲"
        case .marriage: return "寃고샎/?숆굅"
        case .breakup: return "?대퀎"
        case .breakupReconciling: return "?뷀빐 以?
        case .crisis: return "?꾧린"
        case .crisisResolved: return "?꾧린 洹밸났"
        case .eternalLove: return "?곸썝???щ옉"
        }
    }
}

typealias RelationshipPath = RelationshipPhase