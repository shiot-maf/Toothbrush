import XCTest

class IntimacyCalculatorTests: XCTestCase {

    func testStageDoesNotRegressOnScoreDecrease() {
        let character = makeMockCharacter(intimacyScore: 38, currentStage: 2)
        XCTAssertEqual(character.currentStage, 2)
        XCTAssertEqual(character.intimacyScore, 38)
    }

    func testStageAdvancesWhenScoreCrossesThreshold() {
        let character = makeMockCharacter(intimacyScore: 56, currentStage: 3)
        XCTAssertEqual(character.currentStage, 3)
        XCTAssertGreaterThanOrEqual(character.intimacyScore, 56)
    }

    func testIntimacyProgressNormalization() {
        let character = makeMockCharacter(intimacyScore: 50, currentStage: 2)
        XCTAssertEqual(character.intimacyProgress, 0.5, accuracy: 0.001)
    }

    func testIntimacyProgressAtMaxScore() {
        let character = makeMockCharacter(intimacyScore: 100, currentStage: 5)
        XCTAssertEqual(character.intimacyProgress, 1.0, accuracy: 0.001)
    }

    func testIntimacyProgressAtZero() {
        let character = makeMockCharacter(intimacyScore: 0, currentStage: 0)
        XCTAssertEqual(character.intimacyProgress, 0.0, accuracy: 0.001)
    }

    func testStageColorMatchesStage() {
        for stage in 0...5 {
            let character = makeMockCharacter(intimacyScore: 0, currentStage: stage)
            XCTAssertNotNil(character.stageColor, "Stage \(stage) should have a color")
        }
    }

    private func makeMockCharacter(intimacyScore: Int, currentStage: Int) -> Character {
        Character(
            id: UUID(), name: "?뚯뒪??, relationship: "?곗씤",
            personality: "?뚯뒪?몄슜", speechStyle: "諛섎쭚",
            background: nil, likes: nil, dislikes: nil,
            intimacyScore: intimacyScore, currentStage: currentStage,
            stageName: stageName(for: currentStage),
            currentPhase: nil, phaseIntimacyScore: 0,
            currentMood: nil, recentStoryEvent: nil,
            lastMessageDate: Date(), totalMessages: 0, createdDate: Date()
        )
    }

    private func stageName(for stage: Int) -> String {
        switch stage {
        case 0: return "?뺣왂寃고샎"
        case 1: return "愿???앷?"
        case 2: return "留덉쓬 ?닿린 ?쒖옉"
        case 3: return "吏꾩젙??媛먯젙 源⑤떕湲?
        case 4: return "?щ옉??鍮좎쭚"
        case 5: return "?곸썝?⑥쓣 ?ㅼ쭚"
        default: return ""
        }
    }
}