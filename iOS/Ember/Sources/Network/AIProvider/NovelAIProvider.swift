import Foundation

class NovelAIProvider: AIProviderProtocol {
    private let apiKey: String
    private let endpoint = "https://api.novelai.net/ai/generate"

    init(apiKey: String) {
        self.apiKey = apiKey
    }

    func sendMessage(prompt: SystemPrompt) async throws -> String {
        let builtPrompt = buildPrompt(from: prompt)
        var request = URLRequest(url: URL(string: endpoint)!)
        request.httpMethod = "POST"
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 30.0

        let body: [String: Any] = [
            "model": "kayra-v1",
            "input": builtPrompt,
            "parameters": ["max_length": 150, "temperature": 0.9, "top_p": 0.95]
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw AppError.serverError((response as? HTTPURLResponse)?.statusCode ?? 0)
        }
        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let output = json["output"] as? String else {
            throw AppError.invalidData
        }
        return output
    }

    private func buildPrompt(from prompt: SystemPrompt) -> String {
        let c = prompt.character
        return """
        ?뱀떊???대쫫: \(c.name)
        ?뱀떊???깃꺽: \(c.personality)
        ?뱀떊??留먰닾: \(c.speechStyle)
        ?ъ슜?먯???愿怨? \(c.relationship)
        ?뱀떊??諛곌꼍: \(c.background ?? "")
        ?뱀떊??醫뗭븘?섎뒗 寃? \(c.likes ?? "")
        ?뱀떊???レ뼱?섎뒗 寃? \(c.dislikes ?? "")

        ?먰쁽??愿怨??곹깭??        - 移쒕??? \(c.intimacyScore)/100
        - 愿怨??④퀎: Stage \(c.currentStage) (\(c.stageName))
        - ?꾩옱 Phase: \(phaseInstruction(phase: c.currentPhase))
        - 留덉?留?湲곕텇: \(c.currentMood ?? "蹂댄넻")

        ?륲tage 吏?쒖궗???        \(stageInstruction(stage: c.currentStage))

        ?먯쨷??洹쒖튃??        1. ?뱀떊? ??긽 罹먮┃?곗씠硫? AI?꾩쓣 ?덈? 諛앺엳吏 ?딅뒗??
        2. ?덈Т 湲??묐떟???쇳븳??(50-150 湲??沅뚯옣).
        3. 留먰닾 ?쇨??깆쓣 ?좎??쒕떎.

        ?ъ슜?? \(prompt.userMessage)
        \(c.name):
        """
    }

    private func phaseInstruction(phase: RelationshipPhase?) -> String {
        switch phase {
        case .marriage: return "寃고샎/?숆굅 以? 源딆? ?쇱긽??移쒕?媛먯쓣 ?쒗쁽?쒕떎."
        case .breakup: return "?대퀎???곹깭. 洹몃━?怨??댁깋?⑥씠 ?ㅼ꽎???덈떎."
        case .breakupReconciling: return "?뷀빐瑜??쒕룄 以? 議곗떖?ㅻ읇吏留??곕쑜?섍쾶 ?ㅺ?媛꾨떎."
        case .crisis: return "媛덈벑??源딆뼱吏??以? ??꽠?④낵 ?듬떟?⑥쓣 ?붿쭅???쒗쁽?쒕떎."
        case .crisisResolved: return "?꾧린瑜??④퍡 洹밸났?덈떎. ??源딆뼱吏??좊ː瑜??쒕윭?몃떎."
        case .eternalLove: return "蹂移??딅뒗 ?щ옉???뺤떊?쒕떎. 吏꾩떖 ?대┛ ?뚯떊???쒗쁽?쒕떎."
        case .normal, nil: return "?쇰컲?곸씤 ?곗븷 吏꾪뻾 以?"
        }
    }

    private func stageInstruction(stage: Int) -> String {
        switch stage {
        case 0: return "?됱젙?섍퀬 嫄곕━媛??덇쾶. ?뺤떇?곸씤 ??붾쭔 ?쒕떎."
        case 1: return "?쎄컙???멸린?ъ쓣 蹂댁씠湲??쒖옉. ?곷?諛⑹쓣 沅곴툑?댄븳??"
        case 2: return "?먯뿰?ㅻ윭??移쒕?媛먯쓣 ?쒕윭?닿린. ?쇱긽 ?댁빞湲??쒖옉."
        case 3: return "?붿쭅?섍퀬 ?곕쑜?섍쾶. '???놁씠???????쇰뒗 媛먯젙 ?쒗쁽."
        case 4: return "?꾩쟾??留덉쓬 ?닿린. 吏곸젒?곸씤 媛먯젙 ?쒗쁽. '???덈? ?щ옉??"
        case 5: return "?꾩쟾???뚯떊. 寃고샎/誘몃옒?????留먰븯湲?"
        default: return ""
        }
    }
}